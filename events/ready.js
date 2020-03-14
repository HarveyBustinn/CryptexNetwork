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

module.exports.once = async () => {
  process.stdout.write('[  Creating  ] Caching messages...'.yellow);

  const messages = await client.databases.messages_cache.find({});
  
  await Promise.all(messages.map(async m => {
    const channel = client.channels.cache.get(m.channel_id);
    if (!channel) return client.databases.messages_cache.remove({ channel_id: m.channel_id }, { multi: true });

    const message = await channel.messages.fetch(m.message_id).catch(e => false);
    if (!message) return client.databases.messages_cache.remove({ channel_id: m.channel_id, message_id: m.message_id });
  }));

  console.log(`\r[ Creating ] Cached ${messages.length} messages${' '.repeat(10)}`.green);
  console.log(`[  Online  ] Logged in as ${client.user.username.magenta}`);
  console.log(`[  Status  ] Serving ${utils.plural(client.guilds.cache.size, 'guild').cyan} and ${utils.plural(client.guilds.cache.reduce((a, b) => a + b.memberCount, 0), 'user').blue}`);
}