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
  description: 'View the usage and description of every command.'
}

module.exports.run = async ({ channel, author }) => {
  const commands = client.commands.array().map(({ options, usage, description, aliases: [ name, ...aliases ] }) => {
    const format = options ? Object.entries(options)
      .map(([s, { usage }]) => `• ${s} ${usage || ''}`).join('\n') :
      usage ? `• **Usage**: \`${usage}\`` : null;

    return `\`${name}\`: ${description}${aliases.length > 0 ? `\n• **Aliases**: \`${aliases.join('`, `')}\`` : ''}${format ? `\n${format}` : ''}`;
  });

  return utils.scroller({ channel, message: commands.join('\n\n'), title: 'Help', author });
}