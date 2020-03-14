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

const { client: { databases, guilds } } = require('../index');

const config = {
  channels: {},
  roles: {},
  emojis: {
    giveaway: '🎉'
  },
  counters: {},
  enabled: {
    welcome: true
  },
  messages: {
    welcome: 'Welcome {tag} to the Discord server!'
  },
  categories: {},
  tickets: {
    settings: {},
    types: {
      default: {
        name: 'default',
        prefix: 'default',
        emoji: '🍪',
        category: '000000000000000000',
        role: '000000000000000000',
        description: 'A default ticket category.',
        questions: [
          {
            q: 'What is your question?',
            e: 'Question'
          }
        ]
      }
    }
  },
  applications: {
    settings: {},
    types: {
      default: {
        name: 'default',
        prefix: 'default',
        emoji: '🍪',
        category: '000000000000000000',
        role: '000000000000000000',
        description: 'A default application category.',
        questions: [
          {
            q: 'What is your timezone?',
            e: 'Timezone'
          }
        ]
      }
    }
  },
  reports: {
    settings: {},
    types: {
      default: {
        name: 'default',
        prefix: 'default',
        emoji: '🍪',
        category: '000000000000000000',
        role: '000000000000000000',
        description: 'A default report category.',
        questions: [
          {
            q: 'Who are you reporting?',
            e: 'Offender'
          }
        ]
      }
    }
  },
  commissions: {
    settings: {},
    types: {}
  }
}

module.exports = {
  ready: {},
  guildCreate: {},
  guildDelete: {}
}

module.exports.ready.once = async () => {
  const cached = await databases.config.find({});
  const add = guilds.cache.filter(g => !cached.some(e => e.guild_id === g.id)).map(({ id }) => ({ guild_id: id, ...config }));

  return databases.config.insert(add);
}

module.exports.guildCreate.every = async ({ id }) => {
  return databases.config.insert({
    guild_id: id,
    ...config
  });
}

module.exports.guildDelete.every = async ({ id }) => {
  return databases.config.remove({ guild_id: id });
}