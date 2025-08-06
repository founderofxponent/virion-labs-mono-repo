class InteractionUtils {
  static getUserInfo(interaction) {
    return {
      id: interaction.user.id,
      tag: interaction.user.tag,
      displayName: interaction.member?.displayName || interaction.user.username,
    };
  }

  static getGuildInfo(interaction) {
    if (!interaction.inGuild()) return null;
    return {
      id: interaction.guild.id,
      name: interaction.guild.name,
      channelId: interaction.channelId,
    };
  }

  static async safeReply(interaction, options) {
    try {
      if (interaction.replied || interaction.deferred) {
        await interaction.editReply(options);
      } else {
        await interaction.reply(options);
      }
    } catch (error) {
      console.error('Failed to send reply:', error);
    }
  }
}

module.exports = { InteractionUtils };