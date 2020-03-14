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

const { client } = require('../index');

module.exports.every = async ({ message, emoji, users }, user) => {
  if (user.bot || message.channel.type === 'dm') return;

  const cache = await client.databases.messages_cache.findOne({ message_id: message.id });
  if (!cache) return;

  if (cache.delete) await users.remove(user);

  return client.emit(`${cache.action}Add`, message, emoji, user, users, cache);
}