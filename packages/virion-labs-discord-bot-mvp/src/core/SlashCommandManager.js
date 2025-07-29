const { SlashCommandBuilder } = require('discord.js');

class SlashCommandManager {
  constructor(config, logger) {
    this.config = config;
    this.logger = logger;
    this.commands = this.buildCommands();
  }

  buildCommands() {
    const joinCommand = new SlashCommandBuilder()
      .setName('join')
      .setDescription('Join a campaign.');

    const requestAccessCommand = new SlashCommandBuilder()
      .setName('request-access')
      .setDescription('Request access to private channels.');

    return [joinCommand, requestAccessCommand];
  }

  getCommands() {
    return this.commands;
  }
}

module.exports = { SlashCommandManager };