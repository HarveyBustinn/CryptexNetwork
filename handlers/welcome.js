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

const { MessageEmbed } = require('discord.js');
const { utils } = require('../index');

module.exports = {
  guildMemberAdd: {}
}

module.exports.guildMemberAdd.every = async ({ guild, user, roles }) => {
  const [ id, message, add ] = await utils.config(guild.id, a => a.enabled.welcome ? [
    a.channels.welcome,
    a.messages.welcome
      .replace(/\{username\}/g, user.username)
      .replace(/\{username_with_tag\}/g, user.tag)
      .replace(/\{tag\}/g, user)
      .replace(/\{count\}/g, guild.memberCount),
    a.roles.welcome || []
  ] : []);

  const channel = guild.channels.cache.get(id);

  if (!channel) return;

  if (add.length > 0) await roles.set(add);

  const embed = new MessageEmbed()
    .setDescription(message);
  
  embed.setThumbnail(user.displayAvatarURL());

  return utils.embed(embed, false, channel);
}