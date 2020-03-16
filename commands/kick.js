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

const { utils } = require('../index');

module.exports = {
  restriction: utils.isAdmin,
  description: 'Kick a user.',
  usage: '<user>',
  arguments: [
    {
      apply: async (a, { guild }) => utils.getUser(guild.members, a),
      error: 'must be a valid user id, name, tag, or nickname'
    }
  ]
}

module.exports.run = async (_, offender) => {
  if (!offender.kickable) throw `I do not have permission to kick ${offender}`;

  await offender.kick();

  return `**${offender.user.tag}** has been kicked.`;
}