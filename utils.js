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

const { config, client: { databases } } = require('./index');
const { MessageEmbed, Util } = require('discord.js');
const fs = require('fs').promises;

const EMOJI_REGEX = /(?:[\u2700-\u27bf]|(?:\ud83c[\udde6-\uddff]){2}|[\ud800-\udbff][\udc00-\udfff]|[\u0023-\u0039]\ufe0f?\u20e3|\u3299|\u3297|\u303d|\u3030|\u24c2|\ud83c[\udd70-\udd71]|\ud83c[\udd7e-\udd7f]|\ud83c\udd8e|\ud83c[\udd91-\udd9a]|\ud83c[\udde6-\uddff]|[\ud83c[\ude01-\ude02]|\ud83c\ude1a|\ud83c\ude2f|[\ud83c[\ude32-\ude3a]|[\ud83c[\ude50-\ude51]|\u203c|\u2049|[\u25aa-\u25ab]|\u25b6|\u25c0|[\u25fb-\u25fe]|\u00a9|\u00ae|\u2122|\u2139|\ud83c\udc04|[\u2600-\u26FF]|\u2b05|\u2b06|\u2b07|\u2b1b|\u2b1c|\u2b50|\u2b55|\u231a|\u231b|\u2328|\u23cf|[\u23e9-\u23f3]|[\u23f8-\u23fa]|\ud83c\udccf|\u2934|\u2935|[\u2190-\u21ff])/;

function isAdmin(member) {
  return !!member.roles.cache.some(r => r.name === config.roles.admin) || member.permissions.has('ADMINISTRATOR');
}

function zeroes(string, length) {
  if (typeof string !== 'string') string = string.toString();
  return `${'0'.repeat(length - string.length)}${string}`;
}

function error(channel, data, keep) {
  if (typeof data === 'object') {
    !data.timestamp && data.setTimestamp();
    !data.footer && config.embed.footer && data.setFooter(config.embed.footer);
    !data.color && config.embed.colour && data.setColor(config.embed.colour);
    data.description && !data.description.endsWith('\n\u200b') && data.setDescription(`${data.description}\n\u200b`);

    return channel.send(data).then(m => !keep && config.deleteResponseAfter >= 0 ? m.delete({ timeout: config.deleteResponseAfter }) : m);
  }

  const sendEmbed = new MessageEmbed()
    .setTitle('Error')
    .setDescription(`${data}\n\u200b`)
    .setTimestamp();

  config.embed.colour && sendEmbed.setColor(config.embed.colour);
  config.embed.footer && sendEmbed.setFooter(config.embed.footer);

  return channel.send(sendEmbed).then(m => !keep && config.deleteResponseAfter >= 0 ? m.delete({ timeout: config.deleteResponseAfter }) : m);
}

function embed(data, title, channel, mod) {
  if(typeof data === 'object') {
    !data.timestamp && data.setTimestamp();
    !data.footer && config.embed.footer && data.setFooter(config.embed.footer);
    !data.color && config.embed.colour && data.setColor(config.embed.colour);
    if (!mod) data.description && !data.description.endsWith('\n\u200b') && data.setDescription(`${data.description}\n\u200b`);
    if (title) data.setTitle(title);

    return channel ? channel.send(data) : data;
  }

  const embed = new MessageEmbed()
    .setDescription(`${data}\n\u200b`)
    .setTimestamp();

  if (title) embed.setTitle(title);

  config.embed.colour && embed.setColor(config.embed.colour);
  config.embed.footer && embed.setFooter(config.embed.footer);

  return channel ? channel.send(embed) : embed;
}

function plural(number, word) {
  return `${number} ${word}${number === 1 ? '' : 's'}`;
}

module.exports = {
  zeroes,
  isAdmin,
  isStaff: member => {
    return member.roles.cache.some(r => r.name === config.roles.staff) || isAdmin(member);
  },
  error,
  success: (channel, data) => {
    if (typeof data === 'object') {
      !data.timestamp && data.setTimestamp();
      !data.footer && config.embed.footer && data.setFooter(config.embed.footer);
      !data.color && config.embed.colour && data.setColor(config.embed.colour);
      data.description && !data.description.endsWith('\n\u200b') && data.setDescription(`${data.description}\n\u200b`);

      return channel.send(data).then(m => config.deleteResponseAfter >= 0 ? m.delete({ timeout: config.deleteResponseAfter }) : m);
    }

    const sendEmbed = new MessageEmbed()
      .setTitle('Success')
      .setDescription(`${data}\n\u200b`)
      .setTimestamp();

    config.embed.colour && sendEmbed.setColor(config.embed.colour);
    config.embed.footer && sendEmbed.setFooter(config.embed.footer);

    return channel.send(sendEmbed).then(m => config.deleteResponseAfter >= 0 ? m.delete({ timeout: config.deleteResponseAfter }) : m);
  },
  remove: message => {
    return config.deleteResponseAfter >= 0 ? message.delete({ timeout: config.deleteResponseAfter }) : message;
  },
  general: (channel, title, data) => {
    if (typeof data === 'object') {
      !data.timestamp && data.setTimestamp();
      !data.footer && config.embed.footer && data.setFooter(config.embed.footer);
      !data.color && config.embed.colour && data.setColor(config.embed.colour);
      data.description && !data.description.endsWith('\n\u200b') && data.setDescription(`${data.description}\n\u200b`);

      if (title) data.setTitle(title);

      return channel.send(data).then(m => config.deleteResponseAfter >= 0 ? m.delete({ timeout: config.deleteResponseAfter }) : m);
    }

    const sendEmbed = new MessageEmbed()
      .setTitle(title)
      .setDescription(`${data}\n\u200b`)
      .setTimestamp();

    config.embed.colour && sendEmbed.setColor(config.embed.colour);
    config.embed.footer && sendEmbed.setFooter(config.embed.footer);

    return channel.send(sendEmbed).then(m => config.deleteResponseAfter >= 0 ? m.delete({ timeout: config.deleteResponseAfter }) : m);
  },
  embed,
  saveConfig: () => {
    return fs.writeFile('./config.json', JSON.stringify(config, null, 2));
  },
  getRole: async (rs, i, s) => {
    const r = rs.find(r => r.name.toLowerCase() === i.toLowerCase() || r.id === (i.match(/\d+/) || [])[0]);
    if (!r && !s) throw `I could not find a role by the name, id, or tag of **${i}**`; else return r;
  },
  getChannel: async (cs, i, t, s) => {
    const c = cs.find(c => (c.name.toLowerCase() === i.toLowerCase() || c.id === (i.match(/\d+/) || [])[0]) && c.type === t);
    if (!c && !s) throw `I could not find a channel by the name, id, or tag of **${i}**`; else return c;
  },
  getUser: async (ms, i, s) => {
    const m = (await ms.fetch()).find(m => [ m.nickname && m.nickname.toLowerCase(), m.user.username.toLowerCase(), m.user.tag.toLowerCase() ].includes(i.toLowerCase()) || m.id === (i.match(/\d+/) || [])[0]);
    if (!m && !s) throw `I could not find a user by the name, id, tag, or nickname of **${i}**`; else return m;
  },
  parseEmoji: e => (e.match(/(\d+)>$/) || [, e ])[1],
  getEmoji: async (es, i, s) => {
    const e = (i.match(EMOJI_REGEX) || [])[0] || es.find(e => e.name === i.toLowerCase() || e.id === (i.match(/(\d+)>$/) || [])[1]);
    if (!e && !s) throw `I could not find an emoji by the id or name of **${i}**`; else return e.id ? e.toString() : e;
  },
  plural,
  formatDate: date => {
    if (typeof date !== 'object') date = new Date(date);
    return `${zeroes(date.getDate(), 2)}-${zeroes(date.getMonth() + 1, 2)}-${date.getFullYear()}_${zeroes(date.getHours(), 2)}-${zeroes(date.getMinutes(), 2)}`;
  },
  formatUTC: date => {
    return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()} ${date.getUTCHours()}:${zeroes(date.getUTCMinutes(), 2)}:${zeroes(date.getUTCSeconds(), 2)} UTC`
  },
  sleep: ms => {
    return new Promise(r => setTimeout(r, ms));
  },
  number: async n => {
    return Math.abs(Number.parseInt(n));
  },
  float: async n => {
    return Math.abs(Number.parseFloat(n));
  },
  notifyOwner: async (guild, message) => {
    if (!guild) return;
    return error((await guild.owner.fetch()).user, message, true).catch(() => {});
  },
  formatSeconds: seconds => {
    if (seconds <= 0) return 'None';

    const s = Math.ceil(seconds % 60);
    const m = Math.floor(seconds / 60 % 60);
    const h = Math.floor(seconds / 3600 % 24);
    const d = Math.floor(seconds / 86400 % 30);
    const mo = Math.floor(seconds / 2592000);

    return `${mo ? `${plural(mo, 'month')} ` : ''}${d ? `${plural(d, 'day')} ` : ''}${h ? `${plural(h, 'hour')} ` : ''}${m ? `${plural(m, 'minute')} ` : ''}${s ? `${plural(s, 'second')} ` : ''}`.slice(0, -1);
  },
  config: (id, func) => {
    return databases.config.findOne({ guild_id: id })
      .then(func)
      .catch(e => false);
  },
  scroller: async ({ channel, message, title, author }, options = {}) => {
    const embeds = Util.splitMessage(message, { maxLength: 500, char: '\n\n', ...options });

    let current = 0;

    const scroller = await channel.send(embed(embeds[current], `${title}${embeds.length === 1 ? '' : ` ${current + 1}/${embeds.length}`}`));

    if (embeds.length > 1) await scroller.react('🔼') && await scroller.react('🔽');

    const emojis = ['🔽', '🔼'];

    while (true) {
      const selection = await scroller.awaitReactions((r, u) => u.id === author.id && emojis.includes(r._emoji.name), { max: 1, time: 300000 })
        .then(r => r.size > 0 ? emojis.indexOf(r.first()._emoji.name) * 2 - 1 : false);

      if (!selection) break;

      current = current + selection >= 0 ? (current + selection) % embeds.length : current + selection + embeds.length;

      await scroller.reactions.cache.get(emojis[(selection + 1) / 2]).users.remove(author);
      await scroller.edit(embed(embeds[current], `${title} ${current + 1}/${embeds.length}`));
    }

    if (config.deleteResponseAfter < 0) return scroller.reactions.removeAll();

    return scroller.delete({ timeout: config.deleteResponseAfter });
  },
  objectFind: (object, func) => {
    if (!object) return null;
    return Object.values(object).find(func);
  },
  awaitMessage: async ({ channel, user, timeout = 120000 }) => {
    const messages = await channel.awaitMessages(m => m.content && m.author.id === user.id, { max: 1, time: timeout });
    return messages.size > 0 ? messages.first() : false;
  },
  formatTime: seconds => {
    const m = Math.floor(seconds / 60 % 60);
    const h = Math.floor(seconds / 3600 % 24);
    const s = Math.ceil(seconds % 60);

    return `${h > 0 ? `${h}:` : ''}${h > 0 ? zeroes(m, 2) : m}:${zeroes(s, 2)}`;
  },
  parseTime: async t => {
    try {
      const [, mo, w, d, h, m, s] = t.match(/(?:(\d+)\s*mo)?\s*(?:(\d+)\s*w)?\s*(?:(\d+)\s*d)?\s*(?:(\d+)\s*h)?\s*(?:(\d+)\s*m)?\s*(?:(\d+)\s*s)?/);
      return [ mo * 2592000, w * 604800, d * 86400, h * 3600, m * 60, s * 1 ].filter(d => d).reduce((a, b) => a + b) * 1000;
    } catch {
      return false;
    }
  }
}