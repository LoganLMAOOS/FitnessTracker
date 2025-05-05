/**
 * Discord webhook integration utility
 * 
 * This utility allows sending notifications to Discord channels via webhooks.
 * Commonly used for admin notifications, error reporting, and activity logs.
 */

// Type for Discord message embeds
interface DiscordEmbed {
  title?: string;
  description?: string;
  color?: number; // Decimal color value
  fields?: Array<{
    name: string;
    value: string;
    inline?: boolean;
  }>;
  timestamp?: string; // ISO string
}

// Type for Discord webhook message
interface DiscordMessage {
  content?: string;
  username?: string;
  avatar_url?: string;
  embeds?: DiscordEmbed[];
}

/**
 * Send a notification to Discord via webhook
 */
export async function sendDiscordNotification(
  message: DiscordMessage
): Promise<boolean> {
  // Check if Discord webhook URL is configured
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) {
    console.log('Discord webhook URL not configured. Skipping notification.');
    return false;
  }

  try {
    // Send the webhook request
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(message),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Discord webhook failed: ${response.status} ${errorText}`);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error sending Discord notification:', error);
    return false;
  }
}

// Helper function for membership notifications
export async function notifyMembershipChange(
  username: string,
  action: 'upgraded' | 'created' | 'key_redeemed' | 'key_force_applied',
  tier: string,
  details?: string
): Promise<boolean> {
  // Color codes for different tiers
  const tierColors = {
    free: 0x808080, // Gray
    premium: 0x3498db, // Blue
    pro: 0x9b59b6, // Purple
    elite: 0xf1c40f, // Gold
  };

  // Get color for the tier (default to green if tier not found)
  const color = tierColors[tier as keyof typeof tierColors] || 0x2ecc71;

  // Format action text
  let actionText: string;
  switch (action) {
    case 'upgraded':
      actionText = 'Membership Upgraded';
      break;
    case 'created':
      actionText = 'New Membership';
      break;
    case 'key_redeemed':
      actionText = 'Membership Key Redeemed';
      break;
    case 'key_force_applied':
      actionText = 'Membership Key Force Applied';
      break;
    default:
      actionText = 'Membership Updated';
  }

  // Create embed
  const embed: DiscordEmbed = {
    title: actionText,
    description: `${username}'s membership was updated.`,
    color,
    fields: [
      {
        name: 'Tier',
        value: tier.charAt(0).toUpperCase() + tier.slice(1),
        inline: true,
      },
      {
        name: 'Action',
        value: actionText,
        inline: true,
      },
    ],
    timestamp: new Date().toISOString(),
  };

  // Add details if provided
  if (details) {
    embed.fields?.push({
      name: 'Details',
      value: details,
    });
  }

  return sendDiscordNotification({
    username: 'FitTrack Memberships',
    embeds: [embed],
  });
}