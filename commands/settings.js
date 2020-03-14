/**
 * Copyright © 2020 GoogleBots
 *
 * All rights reserved. No part of this publication may be
 * reproduced, distributed, or transmitted in any form or
 * by any means, including photocopying, recording, or other
 * electronic or mechanical methods, without the prior written
 * permission of the publisher.
 *
 * Created in Canada
 *
 * This software is distributed 'as is' and with no warranties of any kind,
 * whether express or implied, including and without limitation, any warranty
 * of merchantability or fitness for a particular purpose.
 *
 * The user (you) must assume the entire risk of using the software.
 *
 * In no event shall any individual, company or organization involved in any way
 * in the development, sale or distribution of this software be liable for any
 * damages whatsoever relating to the use, misuse, or inability to use this software
 * (including, without limitation, damages for loss of profits, business interruption,
 * loss of information, or any other loss).
 */

const { Util, MessageEmbed } = require('discord.js');
const { utils, client: { databases } } = require('../index');

module.exports = {
  aliases: ['setting', 'config'],
  restriction: utils.isAdmin,
  description: 'Handle server settings.',
  options: {
    welcome: {
      options: {
        channel: {
          usage: '<channel>',
          arguments: [
            {
              apply: async (a, { guild }) => a && utils.getChannel(guild.channels.cache, a, 'text'),
              error: 'must be a valid channel id, name, or tag'
            }
          ]
        },
        message: {
          usage: '<message>\n\n**Placeholders**: {username}, {username_with_tag}, {tag}, {count}',
          arguments: [
            {
              boolean: async a => !!a,
              error: 'must be present'
            }
          ]
        },
        enable: {
          arguments: [
            {
              apply: async (a, { guild }) => await databases.config.update({ guild_id: guild.id, 'enabled.welcome': false }, { $set: { 'enabled.welcome': true } }) + 1
            }
          ]
        },
        disable: {
          arguments: [
            {
              apply: async (a, { guild }) => await databases.config.update({ guild_id: guild.id, 'enabled.welcome': true }, { $set: { 'enabled.welcome': false } }) + 1
            }
          ]
        },
        roles: {
          options: {
            add: {
              usage: '<role>',
              arguments: [
                {
                  apply: async (a, { guild }) => utils.getRole(guild.roles.cache, a),
                  error: 'must be a valid role id, name, or tag'
                }
              ]
            },
            remove: {
              usage: '<role>',
              arguments: [
                {
                  apply: async (a, { guild }) => utils.getRole(guild.roles.cache, a),
                  error: 'must be a valid role id, name, or tag'
                }
              ]
            },
            list: {}
          }
        }
      }
    },
  }
}

module.exports.options.welcome.options.channel.run = async ({ guild }, channel) => {
  await databases.config.update({ guild_id: guild.id }, { $set: { 'channels.welcome': channel.id } });
  return `Welcome channel has been set to ${channel}.`;
}

module.exports.options.welcome.options.message.run = async ({ guild }, ...message) => {
  await databases.config.update({ guild_id: guild.id }, { $set: { 'messages.welcome': message.join(' ') } });
  return `Welcome message has been set to\n\`\`\`\n${Util.escapeCodeBlock(message.join(' '))}\`\`\``;
}

module.exports.options.welcome.options.enable.run = async (_, updated) => {
  if (updated <= 1) throw 'Welcoming members is already enabled.';
  return 'Welcoming members has been enabled.';
}

module.exports.options.welcome.options.disable.run = async (_, updated) => {
  if (updated <= 1) throw 'Welcoming members is already disabled.';
  return 'Welcoming members has been disabled.';
}

module.exports.options.welcome.options.roles.options.remove.run = async ({ guild }, role) => {
  if (await databases.config.update({ guild_id: guild.id, 'roles.welcome': role.id }, { $pull: { 'roles.welcome': role.id } }) > 0)
    return `\`${role.name}\` will no longer be applied to new users.`;
  else
    throw `\`${role.name}\` was not being applied to new users.`;
}

module.exports.options.welcome.options.roles.options.add.run = async ({ guild }, role) => {
  if (await databases.config.update({ guild_id: guild.id, $not: { 'roles.welcome': role.id } }, { $addToSet: { 'roles.welcome': role.id } }) > 0)
    return `\`${role.name}\` will be applied to new users.`;
  else
    throw `\`${role.name}\` is already being applied to new users.`;
}

module.exports.options.welcome.options.roles.options.list.run = async ({ guild }) => {
  const roles = await utils.config(guild.id, a => a.roles.welcome.map(r => `<@&${r}>`).join(', ')) || 'None';
  
  return utils.embed(new MessageEmbed()
    .setDescription(roles), 'Roles');
}
