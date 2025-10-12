import { supabase } from '@/integrations/supabase/client';

export interface CreateNotificationParams {
  userId: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  metadata?: Record<string, any>;
}

export const createNotification = async ({
  userId,
  type,
  title,
  message,
  link,
  metadata = {},
}: CreateNotificationParams) => {
  try {
    const { error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        link,
        metadata,
        is_read: false,
      });

    if (error) {
      console.error('Error creating notification:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to create notification:', error);
    return false;
  }
};

// Notify room members when a new thread is created
export const notifyRoomMembersNewThread = async (
  roomId: string,
  threadId: string,
  threadTitle: string,
  authorId: string
) => {
  try {
    // Get room members (excluding the author)
    const { data: members } = await supabase
      .from('room_memberships')
      .select('user_id')
      .eq('room_id', roomId)
      .neq('user_id', authorId);

    if (!members || members.length === 0) return;

    // Get author name
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', authorId)
      .single();

    const authorName = authorProfile?.full_name || 'Someone';

    // Create notifications for all members
    const notifications = members.map(member => ({
      user_id: member.user_id,
      type: 'new_thread',
      title: 'New Thread',
      message: `${authorName} posted a new thread: "${threadTitle}"`,
      link: `/lighthouse/${roomId}/thread/${threadId}`,
      metadata: { room_id: roomId, thread_id: threadId, author_id: authorId },
      is_read: false,
    }));

    await supabase.from('notifications').insert(notifications);
  } catch (error) {
    console.error('Error notifying room members:', error);
  }
};

// Notify comment author when someone replies
export const notifyCommentReply = async (
  parentCommentId: string,
  threadId: string,
  roomId: string,
  replyAuthorId: string
) => {
  try {
    // Get parent comment author
    const { data: parentComment } = await supabase
      .from('thread_comments')
      .select('author_id')
      .eq('id', parentCommentId)
      .single();

    if (!parentComment || parentComment.author_id === replyAuthorId) return;

    // Get reply author name
    const { data: replyAuthor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', replyAuthorId)
      .single();

    const authorName = replyAuthor?.full_name || 'Someone';

    await createNotification({
      userId: parentComment.author_id,
      type: 'comment_reply',
      title: 'New Reply',
      message: `${authorName} replied to your comment`,
      link: `/lighthouse/${roomId}/thread/${threadId}`,
      metadata: { 
        thread_id: threadId, 
        room_id: roomId,
        reply_author_id: replyAuthorId,
        parent_comment_id: parentCommentId
      },
    });
  } catch (error) {
    console.error('Error notifying comment reply:', error);
  }
};

// Notify thread author when their thread is verified/featured
export const notifyThreadVerified = async (
  threadId: string,
  roomId: string,
  authorId: string,
  trustScore: number,
  isFeatured: boolean = false
) => {
  try {
    const message = isFeatured
      ? `Your thread has been verified with a trust score of ${trustScore} and featured!`
      : `Your thread has been verified with a trust score of ${trustScore}`;

    await createNotification({
      userId: authorId,
      type: 'thread_verified',
      title: isFeatured ? 'Thread Featured!' : 'Thread Verified',
      message,
      link: `/lighthouse/${roomId}/thread/${threadId}`,
      metadata: { 
        thread_id: threadId, 
        room_id: roomId,
        trust_score: trustScore,
        is_featured: isFeatured
      },
    });
  } catch (error) {
    console.error('Error notifying thread verified:', error);
  }
};

// Parse and notify mentioned users
export const parseMentionsAndNotify = async (
  content: string,
  threadId: string,
  roomId: string,
  authorId: string
) => {
  try {
    // Match @username patterns
    const mentionPattern = /@(\w+)/g;
    const matches = content.matchAll(mentionPattern);
    const mentionedUsernames = new Set<string>();

    for (const match of matches) {
      mentionedUsernames.add(match[1].toLowerCase());
    }

    if (mentionedUsernames.size === 0) return;

    // Get profiles matching usernames (using full_name as proxy for now)
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, full_name')
      .ilike('full_name', `%${Array.from(mentionedUsernames).join('%')}`);

    if (!profiles || profiles.length === 0) return;

    // Get author name
    const { data: authorProfile } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', authorId)
      .single();

    const authorName = authorProfile?.full_name || 'Someone';

    // Create notifications for mentioned users
    const notifications = profiles
      .filter(profile => profile.user_id !== authorId)
      .map(profile => ({
        user_id: profile.user_id,
        type: 'mention',
        title: 'You were mentioned',
        message: `${authorName} mentioned you in a comment`,
        link: `/lighthouse/${roomId}/thread/${threadId}`,
        metadata: { 
          thread_id: threadId, 
          room_id: roomId,
          author_id: authorId
        },
        is_read: false,
      }));

    if (notifications.length > 0) {
      await supabase.from('notifications').insert(notifications);
    }
  } catch (error) {
    console.error('Error parsing mentions:', error);
  }
};

// Notify thread author about new comment
export const notifyThreadAuthorNewComment = async (
  threadId: string,
  roomId: string,
  commentAuthorId: string
) => {
  try {
    // Get thread details
    const { data: thread } = await supabase
      .from('room_threads')
      .select('author_id, title')
      .eq('id', threadId)
      .single();

    if (!thread || thread.author_id === commentAuthorId) return;

    // Get comment author name
    const { data: commentAuthor } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('user_id', commentAuthorId)
      .single();

    const authorName = commentAuthor?.full_name || 'Someone';

    await createNotification({
      userId: thread.author_id,
      type: 'new_comment',
      title: 'New Comment',
      message: `${authorName} commented on "${thread.title}"`,
      link: `/lighthouse/${roomId}/thread/${threadId}`,
      metadata: { 
        thread_id: threadId, 
        room_id: roomId,
        comment_author_id: commentAuthorId
      },
    });
  } catch (error) {
    console.error('Error notifying thread author:', error);
  }
};
