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
const { utils, client } = require('../index');

module.exports = {
  ignore: true,
  restriction: utils.isStaff,
  description: 'View the ping of the bot.',
}

module.exports.run = async ({ channel, createdTimestamp }) => {
  const pinging = await utils.embed(new MessageEmbed()
    .addField('Latency', 'Pinging...', true)
    .addField('Websocket', 'Pinging...', true), 'Ping', channel);

  return pinging.edit(utils.embed(new MessageEmbed()
    .addField('Latency', `${(pinging.createdTimestamp - createdTimestamp).toFixed()}ms`, true)
    .addField('Websocket', `${client.ws.ping.toFixed()}ms`, true), 'Ping')).then(utils.remove);
}