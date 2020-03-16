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

require('colors');

const { Client, Collection, version } = require('discord.js');
const { readdir } = require('fs').promises;
const { token } = require('./config.json')
const Datastore = require('nedb-promises');

const client = new Client();

module.exports = {
  client,
  config: require('./config.json'),
};

function loadEvents(e) {
  Object.entries(e).forEach(([ e, f ]) => {
    const table = client.events.get(e) || client.events.set(e, { every: [], once: [] }).get(e);

    if (f.every) table.every.push(f.every);
    if (f.once) table.once.push(f.once);
  });
}

(async () => {
  if (process.version.match(/\d+/)[0] < 12) {
    console.log(`[ Fatal ] Please use Node.js version 12 or higher.\n[ Fatal ] Current version: ${process.version.slice(1)}`.red);
    process.exit();
  } else if (version.match(/^\d+/)[0] < 12) {
    console.log(`[ Fatal ] Please use Discord.js version 12 or higher.\n[ Fatal ] Current version: ${version}`.red);
    process.exit();
  }

  const start = Date.now();

  client.events = new Collection();

  client.databases = (await readdir('storage'))
    .filter(f => f.endsWith('.db'))
    .map(f => f.slice(0, -3))
    .reduce((o, d) => {
      o[d] = Datastore.create({ filename: `./storage/${d}.db`, autoload: true });

      return o;
    }, {});

  console.log(`[ Starting ] Loaded ${Object.keys(client.databases).length} databases`.green);

  const utils = require('./utils');
  module.exports.utils = utils;

  client.commands = new Collection((await readdir('commands'))
    .map(f => f.slice(0, -3))
    .map(c => {
      const command = require(`./commands/${c}.js`);

      if (command.aliases) command.aliases.unshift(c); else command.aliases = [ c ];
      if (command.events) loadEvents(command.events);

      return [ c, command ];
    }));

  console.log(`[ Starting ] Loaded ${client.commands.size} commands`.green);

  (await readdir('events'))
    .map(c => c.slice(0, -3))
    .forEach(e => {
      const event = require(`./events/${e}.js`);

      if (event.events) loadEvents(event.events);
      return loadEvents({ [e]: event });
    });

  (await readdir('handlers'))
    .forEach(h => {
      const handler = require(`./handlers/${h}`);

      return loadEvents(handler);
    });

  try {
    const commands = require('./custom.json');

    for (const { command, aliases, response, description } of commands) {
      client.commands.set(command, {
        aliases: [ command, ...(aliases || []) ],
        description,
        ignore: true,
        run: ({ channel }) => {
          return channel.send({ content: response.message || '', embed: response.embed || undefined, files: response.files || undefined })
            .then(m => response.delete > 0 && m.delete(response.delete))
        }
      });
    }

    console.log(`[ Starting ] Loaded ${utils.plural(Object.keys(commands).length, 'custom command')}`.green);
  } catch(e) {
    console.log(`[   Warn   ] Could not parse custom.json`.red);
  }

  for (const [event, functions] of client.events.entries()) {
    if (functions.every) client.on(event, (...a) => functions.every.forEach(f => f(...a)));
    if (functions.once) client.once(event, (...a) => functions.once.forEach(f => f(...a)));
  }

  console.log(`[ Starting ] Loaded ${client.events.size} events`.green);
  console.log(`[  Loaded  ] Finished startup in ${((Date.now() - start) / 1000).toFixed(2)}s.`.brightGreen);

  client.login(process.env.BOT_TOKEN);
})();
