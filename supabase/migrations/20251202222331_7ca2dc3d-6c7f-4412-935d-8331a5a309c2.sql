-- Fix Business Day NG description which contains HTML
UPDATE organizations 
SET description = 'Leading Nigerian business news publication covering finance, economy, and governance'
WHERE domain = 'businessday.ng';