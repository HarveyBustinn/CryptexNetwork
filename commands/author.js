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

const { MessageEmbed } = require('discord.js');
const { client, utils } = require('../index');

module.exports = {
  aliases: ['ownership'],
  description: 'View the author of the bot.'
}

module.exports.run = async () => {
  const owner = await client.fetchApplication().then(a => ((a.owner.owner && a.owner.owner.user) || a.owner));

  return utils.embed(new MessageEmbed()
    .addField('Author', '**GoogleSites#8278** (314566854376947725)\n\u200b')
    .addField('Client', '**Jeffo#0001** (447835760662413324)\n\u200b')
    .addField('Application Owner', `**${owner.tag}** (${owner.id})\n\u200b`), 'Ownership');
}

