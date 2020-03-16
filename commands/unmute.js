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
  description: 'Unmute a user.',
  usage: '<user>',
  arguments: [
    {
      apply: async (a, { guild }) => utils.getUser(guild.members, a),
      error: 'must be a valid user id, name, tag, or nickname'
    }
  ]
}

module.exports.run = async ({ guild }, offender) => {
  const id = await utils.config(guild.id, a => a.roles.muted);
  if (!id) throw 'You have not set a mute role.';

  const role = await utils.getRole(guild.roles.cache, id);

  if (!offender.roles.cache.some(r => r.id === role.id)) throw `${offender} is not muted.`;

  await offender.roles.remove(role);

  return `${offender} has been unmuted.`;
}