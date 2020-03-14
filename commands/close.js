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

const { client, utils } = require('../index');

module.exports = {
  ignore: true,
  keep: true,
  restriction: async (m, c) => utils.isStaff(m) || await client.databases.channels.findOne({ channel_id: c.id, discord_id: m.id }),
  description: 'Close the current channel.',
  arguments: [
    {
      apply: async a => a || 'None'
    }
  ],
  usage: '[reason]'
}

module.exports.run = async ({ channel, author, guild }, ...r) => {
  const closable = await client.databases.channels.findOne({ channel_id: channel.id });
  if (!closable) throw 'This channel cannot be closed.';

  const reason = r.join(' ');

  const messages = [];

  while (true) {
    const collection = await channel.messages.fetch({ limit: 100, before: (messages[messages.length - 1] || { id: undefined }).id });
    if (collection.size <= 0) break;
    messages.push(...collection.array());
  }

  await channel.delete();
  await client.databases.channels.remove({ channel_id: channel.id });

  return client.emit(`${closable.type}Close`, { guild, channel, user: author }, closable, reason, messages.reverse());
}