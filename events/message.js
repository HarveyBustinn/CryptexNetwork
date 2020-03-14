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

const { config: { prefix, helpOnInvalidCommand }, client, utils } = require('../index');

function getCommand(command, arguments, parents, options, restriction) {
  if (!command) return [ true, `<${Object.keys(options).join('/')}>`, parents.slice(0, -1) ];

  if (command.options) {
    const key = arguments[0] && arguments.shift().toLowerCase();
    return getCommand(command.options[key], arguments, [ ...parents, key ], command.options, command.restriction || restriction);
  }

  return [ false, command, parents, command.restriction || restriction ];
}

module.exports.every = async (message) => {
  if (message.author.bot || !message.content.startsWith(prefix) || message.content.length === prefix.length || message.channel.type === 'dm') return;

  const arguments = [...message.content.slice(prefix.length).matchAll(/(["'`])(.+?)\1(?![^ \t]+)|([^ \t]+)/gs)]
    .map(m => m[3] || m[2].replace(new RegExp(`${m[1]}{2}`, 'g'), m[1]));

  const key = arguments.shift().toLowerCase();
  
  const main = client.commands.find(c => c.aliases.includes(key));
  if (!main && !helpOnInvalidCommand) return; else if (!main && helpOnInvalidCommand) return client.commands.get('help').run(message);

  const [ error, command, parents, restriction ] = getCommand(main, arguments, [ key ]);

  if (!command.keep) message.delete({ timeout: 1000 });

  if (error)
    return utils.error(message.channel, `**Usage**: ${prefix}${parents.join(' ')} ${command}`);

  if (restriction && !(await restriction(message.member, message.channel)))
    return utils.error(message.channel, 'You do not have permission to perform this command.');

  if (command.arguments) {
    for (let i = 0; i < command.arguments.length; i++) {
      const { boolean, error, apply } = command.arguments[i];

      const result = await (apply || boolean)(arguments[i], message, arguments[i - 1]).catch(() => {})

      if (!result)
        return utils.error(message.channel, `Argument #${i + 1} ${error}.\n\n**Usage**: ${prefix}${parents.join(' ')} ${command.usage}`);

      if (apply) arguments[i] = result;
    }
  }

  if (command.format) arguments.forEach(a => a = command.format(a));

  if (command.run) return command.run(message, ...arguments)
    .then(r => !command.ignore && utils.success(message.channel, r))
    .catch(e => utils.error(message.channel, e.message || e));
}