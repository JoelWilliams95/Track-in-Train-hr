// Utility functions for sending notifications

export async function sendTagNotification(taggedUserName: string, taggerName: string, profileName: string, comment: string, profileId?: string) {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'tag',
        targetUsers: [taggedUserName],
        message: `${taggerName} tagged you in a comment on ${profileName}'s profile: ${comment}`,
        data: {
          taggerName,
          profileName,
          profileId: profileId || profileName, // Use profileId if provided, fallback to profileName
          comment: comment.substring(0, 200),
          actionType: 'view_profile'
        }
      }),
    });
  } catch (error) {
    console.error('Error sending tag notification:', error);
  }
}

export async function sendProfileAddedNotification(zone: string, profileName: string, adderName: string, profileId?: string) {
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type: 'profile_added',
        targetZone: zone,
        message: `New profile added to your zone: ${profileName} (added by ${adderName})`,
        data: {
          zone,
          profileName,
          profileId: profileId || profileName, // Use profileId if provided, fallback to profileName
          adderName,
          actionType: 'view_profile'
        }
      }),
    });
  } catch (error) {
    console.error('Error sending profile added notification:', error);
  }
}

// Extract mentioned users from comment text
export async function extractMentionedUsers(commentText: string): Promise<string[]> {
  console.log('🔍 Extracting mentions from:', commentText);

  // More robust regex to match @username patterns
  const mentionRegex = /@([A-Za-z\s]+?)(?=\s|$|[^\w\s])/g;
  const mentions: string[] = [];
  let match;

  // Fetch actual system users from tagging API
  let systemUsers: any[] = [];
  try {
    const response = await fetch('/api/users/tagging');
    if (response.ok) {
      const data = await response.json();
      systemUsers = data.users || [];
      console.log('🔍 Found', systemUsers.length, 'system users for mention matching');
    } else {
      console.error('❌ Failed to fetch users for mention extraction:', response.status);
    }
  } catch (error) {
    console.error('❌ Error fetching users for mention extraction:', error);
  }

  // Add default system users as fallback
  const defaultUsers = [
    { fullName: 'SuperAdmin' },
    { fullName: 'Super Admin' },
    { fullName: 'Admin' }
  ];

  const allUsers = [...systemUsers, ...defaultUsers];

  while ((match = mentionRegex.exec(commentText)) !== null) {
    const mentionedName = match[1].trim();
    console.log('🔍 Found potential mention:', mentionedName);

    // Check if this is a real user (exact match)
    const user = allUsers.find(u =>
      u.fullName.toLowerCase() === mentionedName.toLowerCase()
    );

    if (user && !mentions.includes(user.fullName)) {
      console.log('✅ Valid mention found:', user.fullName);
      mentions.push(user.fullName);
    } else {
      console.log('❌ No matching user found for:', mentionedName);
    }
  }

  console.log('🎯 Final mentions extracted:', mentions);
  return [...new Set(mentions)]; // Remove duplicates
}
