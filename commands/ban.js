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

const { utils, client: { databases, guilds } } = require('../index');

module.exports = {
  restriction: utils.isAdmin,
  description: 'Ban a user.',
  usage: '<user> [time]',
  arguments: [
    {
      apply: async (a, { guild }) => utils.getUser(guild.members, a),
      error: 'must be a valid user id, name, tag, or nickname'
    }
  ],
  events: {
    ready: {},
    guildDelete: {}
  }
}

module.exports.run = async ({ guild }, offender, ...t) => {
  if (!offender.bannable) throw `I do not have permission to ban ${offender}`;

  const time = t.length > 0 ? await utils.parseTime(t.join(' ')) : null;
  if (time === false) throw `\`${t.join(' ')}\` is not a valid timestamp.\n\nExample: \`1mo 1w 1d 1h 1m 1s\``;

  await offender.ban();

  if (time === null) return `**${offender.user.tag}** has been banned.`;

  await databases.bans.update({ guild_id: guild.id, discord_id: offender.id }, { $set: { expiry: Date.now() + time } }, { upsert: true });

  return `**${offender.user.tag}** has been banned for ${utils.formatSeconds(time / 1000)}.`;
}

module.exports.events.ready.once = async () => {
  const ids = guilds.cache.map(g => g.id);
  await databases.bans.remove({ guild_id: { $nin: ids } }, { multi: true });

  while (true) {
    const unban = await databases.bans.find({ expiry: { $lte: Date.now() } });
    const mapped = unban.reduce((a, b) => {
      a[b.guild_id] ? a[b.guild_id].push(b.discord_id) : a[b.guild_id] = [b.discord_id];
      return a;
    }, {});

    await Promise.all(unban.map(({ guild_id, discord_id }) =>
      guilds.cache.get(guild_id).members.unban(discord_id, `Temporary ban expired on ${Date.now()}`)
        .catch(() => {})));
    
    for (const [ guild, members ] of Object.entries(mapped)) {
      await databases.bans.remove({ guild_id: guild, discord_id: { $in: members } }, { multi: true });
    }
    
    await utils.sleep(10000);
  }
}

module.exports.events.guildDelete.every = async (guild) => {
  return databases.bans.remove({ guild_id: guild.id }, { multi: true });
}