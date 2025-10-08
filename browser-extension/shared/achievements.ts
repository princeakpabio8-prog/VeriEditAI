export interface Achievement {
  id: string;
  title: string;
  description: string;
  threshold: number;
  icon: string;
}

export const achievements: Achievement[] = [
  {
    id: 'first_verify',
    title: '🎯 First Verification',
    description: 'Completed your first fact check',
    threshold: 1,
    icon: '🎯'
  },
  {
    id: 'truth_seeker',
    title: '🔍 Truth Seeker',
    description: 'Verified 10 pieces of content',
    threshold: 10,
    icon: '🔍'
  },
  {
    id: 'fact_checker',
    title: '✅ Fact Checker',
    description: 'Verified 50 pieces of content',
    threshold: 50,
    icon: '✅'
  },
  {
    id: 'verification_hero',
    title: '🏆 Verification Hero',
    description: 'Verified 100 pieces of content',
    threshold: 100,
    icon: '🏆'
  },
  {
    id: 'misinformation_fighter',
    title: '🛡️ Misinformation Fighter',
    description: 'Verified 500 pieces of content',
    threshold: 500,
    icon: '🛡️'
  },
  {
    id: 'truth_champion',
    title: '👑 Truth Champion',
    description: 'Verified 1000 pieces of content',
    threshold: 1000,
    icon: '👑'
  }
];

export async function checkAndAwardAchievements(verificationCount: number): Promise<Achievement[]> {
  const storage = await chrome.storage.local.get(['achievements']);
  const unlockedAchievements: Set<string> = new Set(storage.achievements || []);
  const newAchievements: Achievement[] = [];

  for (const achievement of achievements) {
    if (verificationCount >= achievement.threshold && !unlockedAchievements.has(achievement.id)) {
      unlockedAchievements.add(achievement.id);
      newAchievements.push(achievement);
      
      // Show notification
      chrome.notifications?.create({
        type: 'basic',
        iconUrl: 'assets/icon-128.png',
        title: 'Achievement Unlocked!',
        message: `${achievement.icon} ${achievement.title}\n${achievement.description}`,
        priority: 2
      });
    }
  }

  if (newAchievements.length > 0) {
    await chrome.storage.local.set({
      achievements: Array.from(unlockedAchievements)
    });
  }

  return newAchievements;
}

export async function getUnlockedAchievements(): Promise<Achievement[]> {
  const storage = await chrome.storage.local.get(['achievements']);
  const unlockedIds: Set<string> = new Set(storage.achievements || []);
  
  return achievements.filter(a => unlockedIds.has(a.id));
}

export async function getVerificationCount(): Promise<number> {
  const storage = await chrome.storage.local.get(['verifications']);
  return (storage.verifications || []).length;
}
