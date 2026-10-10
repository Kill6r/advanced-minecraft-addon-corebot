const Discord = require("discord.js");
const Utils = require("../src/modules/utils");
const Embed = Utils.Embed;
const CommandHandler = require("../src/modules/handlers/CommandHandler");
const EventHandler = require("../src/modules/handlers/EventHandler.js");
const chalk = require("chalk");
const axios = require("axios");
const Row = Discord.MessageActionRow;
const Button = Discord.MessageButton;
const Modal = Discord.Modal;
const Text = Discord.TextInputComponent;
const mongoose = require("mongoose");
const Schema = mongoose.Schema;
const mysql = require("mysql");
const prefix =
  chalk.hex("#804000").bold("[Advanced ") + chalk.green.bold("Minecraft]");

module.exports = {
  run: async (bot) => {
    /* #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Variables, Schemas Mongoose & Funciones -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=# */

    async function run() {
      /* Table */
      const style = {
        name: "custom",
        borders: {
          top: {
            left: "┌",
            center: "─",
            right: "┐",
            colSeparator: "─",
          },
          middle: {
            left: "│",
            center: "─",
            right: "│",
            colSeparator: "│",
          },
          bottom: {
            left: "└",
            center: "─",
            right: "┘",
            colSeparator: "─",
          },
          data: {
            left: "│",
            center: " ",
            right: "│",
            colSeparator: "│",
          },
        },
      };
      const { AsciiTable3 } = require("ascii-table3");

      const Licencia = async () => {
        const endpoint = Config?.LicenseValidation?.Endpoint;
        const apiKey = Config?.LicenseValidation?.ApiKey;

        if (!endpoint || !apiKey || apiKey === "CHANGE_ME") {
          console.log(prefix + chalk.red(" Missing license validation configuration."));
          return [];
        }

        let res;
        try {
          res = await axios.post(
            endpoint,
            { key: apiKey },
            { timeout: 10000 }
          );
        } catch (error) {
          console.log(prefix + chalk.red(` License validation failed: ${error.message}`));
          return [];
        }

        const data = res.data.filter(
          (i) =>
            i.licencia === Config.License && i.producto === "Advanced-Minecraft"
        );
        return data;
      };

      let busqueda = await Licencia();
      if (busqueda[0] === undefined) {
        let table = new AsciiTable3(
          chalk.hex("88e5f7").bold("Advanced Minecraft")
        );
        table
          .setHeading(chalk.gray.bold("License"), chalk.gray.bold("Type"))
          .addRow(chalk.yellow(`${Config.License}`), chalk.red("Invalid"));

        table.addStyle(style);
        table.setStyle("custom");

        console.log("\n" + table.toString());

        console.log(
          prefix + " Addon unloaded (" + chalk.gray.bold("v1.0.1") + ")"
        );
        console.log(
          prefix +
            chalk.red(
              " The key is not correct, please change the key from the config file and then restart the bot."
            )
        );
        return false;
      }
      if (busqueda[0].tipo === false || busqueda[0].tipo === undefined) {
        let table = new AsciiTable3(
          chalk.hex("88e5f7").bold("Advanced Minecraft")
        );
        table
          .setHeading(
            chalk.gray.bold("Created"),
            chalk.gray.bold("License"),
            chalk.gray.bold("Type")
          )
          .addRow(
            chalk.yellow(`${busqueda[0].creada}`),
            chalk.yellow(`${Config.License}`),
            chalk.red("Invalid")
          );

        table.addStyle(style);
        table.setStyle("custom");

        console.log("\n" + table.toString());

        console.log(
          prefix + " Addon unloaded (" + chalk.gray.bold("v1.0.1") + ")"
        );
        console.log(
          prefix +
            chalk.red(
              " The key is not correct, please change the key from the config file and then restart the bot."
            )
        );
        return false;
      }
      let table = new AsciiTable3(chalk.blue.bold("Advanced Minecraft"));
      table
        .setHeading(
          chalk.gray.bold("Created"),
          chalk.gray.bold("License"),
          chalk.gray.bold("Type")
        )
        .addRow(
          chalk.yellow(`${busqueda[0].creada}`),
          chalk.yellow(`${Config.License}`),
          chalk.green("Valid")
        );

      table.addStyle(style);
      table.setStyle("custom");

      console.log("\n" + table.toString());

      console.log(prefix + " Addon loaded (" + chalk.gray.bold("v1.0.1") + ")");
      return true;
    }

    let Config = async () => {
      const yml = require("../src/modules/yml.js");
      const cfg = await yml("./configs/addons/Advanced-Minecraft_config.yml");
      return cfg;
    };
    Config = await Config();

    const licenseValid = await run();
    if (!licenseValid) return;

    let Storage;
    let Sync;
    let SyncTemporal;
    let Verify;

    if (Config.Database.Sync.Storage.toLowerCase() !== "mongodb") {
      console.log(
        prefix +
          chalk.red(
            " This CoreBot addon currently requires MongoDB for synchronization storage."
          )
      );
      return;
    }

    Storage = "mongodb";

    if (Storage === "mongodb") {
      const collectionName = Config.Database.Sync.Options.Mongo.Collection;
      const uri =
        Config.Database.Sync.Options.Mongo.Connect +
        Config.Database.Sync.Options.Mongo.Database;

      mongoose.set("strictQuery", false);

      await mongoose
        .connect(uri, {
          useNewUrlParser: true,
          useUnifiedTopology: true,
        })
        .then(() => {
          console.log(
            Utils.infoPrefix +
              `${chalk.blue.bold("[SYNC]")} ${chalk.green.underline(
                `√ Successfully connected database!`
              )}.`
          );
        })
        .catch((err) => {
          console.log(Utils.errorPrefix + err.message);
          console.log(
            Utils.infoPrefix +
              `${chalk.blue.bold("[SYNC]")} ${chalk.red.underline(
                `✘ Database not connected!`
              )} .`
          );
          process.exit(0);
        });

      const syncSchema = new Schema(
        {
          guild_id: String,
          code: String,
          nickname: String,
          nick: String,
          discord_tag: String,
          discord_id: String,
          uuid: String,
          verified: Boolean,
        },
        { collection: `${collectionName}` }
      );

      const syncTemporalSchema = new Schema({
        codigo: String,
        username: String,
        user: String,
        date: String,
        id: String,
      });

      Sync =
        mongoose.models[`${collectionName}`] ||
        mongoose.model(`${collectionName}`, syncSchema);

      SyncTemporal =
        mongoose.models["synctemporal"] ||
        mongoose.model("synctemporal", syncTemporalSchema);

      const verifySchema = new Schema({
        guild_id: String,
        nickname: String,
        discord_tag: String,
        discord_id: String,
        uuid: String,
        date: String,
      });

      Verify =
        mongoose.models["verify"] || mongoose.model("verify", verifySchema);
    } else {
    }

    const generateCode = () => {
      const code = () => {
        return Array.apply(0, Array(4))
          .map(() => {
            return ((charset) => {
              return charset.charAt(Math.floor(Math.random() * charset.length));
            })("0123456789");
          })
          .join("");
      };

      return `${code()}`;
    };

    const lookupUUID = async (name) => {
      let res = await axios.get(
        `https://api.mojang.com/users/profiles/minecraft/${name}`
      );
      let str = res.data.id;
      str =
        str.slice(0, 8) +
        "-" +
        str.slice(8, 12) +
        "-" +
        str.slice(12, 16) +
        "-" +
        str.slice(16, 20) +
        "-" +
        str.slice(20, str.length);
      res.data.raw_id = str;

      return res.data;
    };

    const lookupName = async (uuid) => {
      let res = await axios.get(
        `https://sessionserver.mojang.com/session/minecraft/profile/${uuid}`
      );
      let str = res.data.id;
      str =
        str.slice(0, 8) +
        "-" +
        str.slice(8, 12) +
        "-" +
        str.slice(12, 16) +
        "-" +
        str.slice(16, 20) +
        "-" +
        str.slice(20, str.length);
      res.data.raw_id = str;
      return res.data;
    };

    async function updateSyncTemporal() {
      let data_1 = await Sync.find().exec();
      let data_2 = await SyncTemporal.find().exec();

      data_2.forEach(async (i, index) => {
        let date = new Date() / 1000;
        if (Number(i.date) <= date) {
          let check = data_1.find((data) => data.discord_id === i.id);
          if (check) {
            await SyncTemporal.deleteOne(i);
            if (check.verified === false) {
              await Sync.deleteMany({ discord_id: i.id });
            }
          }
        }
      });
    }
    setInterval(async () => await updateSyncTemporal(), 3000);

    async function verify() {
      let data_1 = await Sync.find().exec();
      let data_2 = await Verify.find().exec();

      data_1.forEach(async (i, index) => {
        if (i.uuid !== "none") {
          let check = data_2.find((c) => c.discord_id === i.discord_id);
          if (!check) {
            let guild = await bot.guilds.cache.get(i.guild_id);
            let role = Utils.findRole(
              Config.Settings.Verified.Role,
              guild,
              false
            );
            let channel = Utils.findChannel(
              Config.Settings.Verified.Channel,
              guild,
              "GUILD_TEXT",
              false
            );
            let date = `${Number(new Date() / 1000) + 600}`.split(".")[0];

            let member = await bot.users.fetch(i.discord_id);
            let nick = i.nick || i.nickname;
            let uuid = i.uuid.replaceAll("-", "");

            console.log(i);

            member.createdAt = {
              toLocaleString: "asd1",
              getTime: "asd2",
            };

            member.displayAvatarURL = () => {
              return `https://cdn.discordapp.com/avatars/${member.id}/${member.avatar}`;
            };
            member.createdAt.toLocaleString = () => {
              return `none`;
            };
            member.createdAt.getTime = () => {
              return 100000;
            };

            await Verify.create({
              guild_id: i.guild_id,
              nickname: i.nick,
              discord_tag: i.discord_tag,
              discord_id: i.discord_id,
              uuid: i.uuid,
              date: date,
            });

            let logEmbed = Utils.setupMessage({
              configPath: Config.Messages.Verified.Logs,
              thumbnail:
                (Config?.Messages?.Verified?.Logs?.Thumbnail ?? false) === false
                  ? undefined
                  : Config.Messages.Verified.Logs.Thumbnail,
              image:
                (Config?.Messages?.Verified?.Logs?.Image ?? false) === false
                  ? undefined
                  : Config.Messages.Verified.Logs.Image,
              variables: [
                ...Utils.userVariables(member, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
                { searchFor: /{nickname}/g, replaceWith: nick },
                { searchFor: /{date}/g, replaceWith: date },
                { searchFor: /{uuid}/g, replaceWith: uuid },
                { searchFor: /{discord_tag}/g, replaceWith: member.tag },
                { searchFor: /{discord_id}/g, replaceWith: member.id },
                {
                  searchFor: /{discord_mention}/g,
                  replaceWith: `<@${member.id}>`,
                },
              ],
            });

            let dmEmbed = Utils.setupMessage({
              configPath: Config.Messages.Verified.DM,
              thumbnail:
                (Config?.Messages?.Verified?.DM?.Thumbnail ?? false) === false
                  ? undefined
                  : Config.Messages.Verified.DM.Thumbnail,
              image:
                (Config?.Messages?.Verified?.DM?.Image ?? false) === false
                  ? undefined
                  : Config.Messages.Verified.DM.Image,
              variables: [
                ...Utils.userVariables(member, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
                { searchFor: /{nickname}/g, replaceWith: nick },
                { searchFor: /{date}/g, replaceWith: date },
                { searchFor: /{uuid}/g, replaceWith: uuid },
                { searchFor: /{discord_tag}/g, replaceWith: member.tag },
                { searchFor: /{discord_id}/g, replaceWith: member.id },
                {
                  searchFor: /{discord_mention}/g,
                  replaceWith: `<@${member.id}>`,
                },
              ],
            });

            if (channel !== false) channel.send(logEmbed);
            if (role !== false)
              guild.members.cache
                .get(i.discord_id)
                .roles.add(role)
                .catch((err) => {});
            guild.members.cache.get(i.discord_id).send(dmEmbed);
          }
        }
      });
    }
    setInterval(async () => await verify(), 3000);

    /* #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Databases -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=# */

    let storageLB;
    let storageLP;

    let LiteBans;
    let LuckPerms;

    if (Config.Database.LiteBans.Enabled === true) {
      storageLB = true;
    } else {
      storageLB = false;
    }

    if (Config.Database.LuckPerms.Enabled === true) {
      storageLP = true;
    } else {
      storageLP = false;
    }

    if (storageLB === true) {
      LiteBans = mysql.createPool({
        connectionLimit: 50,
        host: Config.Database.LiteBans.Host,
        user: Config.Database.LiteBans.User,
        password: Config.Database.LiteBans.Password,
        database: Config.Database.LiteBans.Database,
        port: Config.Database.LiteBans.Port,
      });

      LiteBans.getConnection(function (err, connection) {
        if (err) {
          console.log(Utils.errorPrefix + err.message);
          console.log(
            Utils.infoPrefix +
              `${chalk.yellow.bold("[LITEBANS]")} ${chalk.red.underline(
                `✘ Database not connected!`
              )} .`
          );
          storageLB = false;
        } else {
          connection.release();
          console.log(
            Utils.infoPrefix +
              `${chalk.yellow.bold("[LITEBANS]")} ${chalk.green.underline(
                `√ Successfully connected database!`
              )}.`
          );
        }
      });
    }

    if (storageLP === true) {
      LuckPerms = mysql.createPool({
        connectionLimit: 50,
        host: Config.Database.LuckPerms.Host,
        user: Config.Database.LuckPerms.User,
        password: Config.Database.LuckPerms.Password,
        database: Config.Database.LuckPerms.Database,
        port: Config.Database.LuckPerms.Port,
      });

      LuckPerms.getConnection(function (err, connection) {
        if (err) {
          console.log(Utils.errorPrefix + err.message);
          console.log(
            Utils.infoPrefix +
              `${chalk.magenta.bold("[LUCKPERMS]")} ${chalk.red.underline(
                `✘ Database not connected!`
              )} .`
          );
          storageLP = false;
        } else {
          connection.release();
          console.log(
            Utils.infoPrefix +
              `${chalk.magenta.bold("[LUCKPERMS]")} ${chalk.green.underline(
                `√ Successfully connected database!`
              )}.`
          );
        }
      });
    }

    async function getRank(user) {
      return new Promise((resolve, reject) => {
        LuckPerms.query(
          `SELECT * FROM luckperms_players WHERE uuid = ? LIMIT 1`,
          [user],
          (err, result) => {
            if (err) reject(err);
            else if (result[0] == undefined) resolve("Not in database");
            else resolve(result[0].primary_group);
          }
        );
      });
    }

    async function getBans(user) {
      return new Promise((resolve, reject) => {
        LiteBans.query(
          `SELECT * FROM ${Config.Database.LiteBans.TablePrefix}bans WHERE uuid = ?`,
          [user],
          (err, result) => {
            if (err) reject(err);
            if (result[0] == undefined) resolve(0);
            else resolve(result);
          }
        );
      });
    }

    async function getKicks(user) {
      return new Promise((resolve, reject) => {
        LiteBans.query(
          `SELECT * FROM ${Config.Database.LiteBans.TablePrefix}kicks WHERE uuid = ?`,
          [user],
          (err, result) => {
            if (err) reject(err);
            if (result[0] == undefined) resolve(0);
            else resolve(result);
          }
        );
      });
    }

    async function getMutes(user) {
      return new Promise((resolve, reject) => {
        LiteBans.query(
          `SELECT * FROM ${Config.Database.LiteBans.TablePrefix}mutes WHERE uuid = ?`,
          [user],
          (err, result) => {
            if (err) reject(err);
            if (result[0] == undefined) resolve(0);
            else resolve(result);
          }
        );
      });
    }

    async function getWarnings(user) {
      return new Promise((resolve, reject) => {
        LiteBans.query(
          `SELECT * FROM ${Config.Database.LiteBans.TablePrefix}warnings WHERE uuid = ?`,
          [user],
          (err, result) => {
            if (err) reject(err);
            if (result[0] == undefined) resolve(0);
            else resolve(result);
          }
        );
      });
    }

    async function test(user) {
      return new Promise((resolve, reject) => {
        LiteBans.query(
          `SELECT * FROM ${Config.Database.LiteBans.TablePrefix}bans`,
          (err, result) => {
            if (err) reject(err);
            if (result[0] == undefined) resolve(0);
            else resolve(result);
          }
        );
      });
    }

    /* console.log(await test("d6e2b71a-0d50-4e1f-a9d1-0591fe524ae1")); */
    /*     console.log(await getMutes("d6e2b71a-0d50-4e1f-a9d1-0591fe524ae1"));
    console.log(await getBans("d6e2b71a-0d50-4e1f-a9d1-0591fe524ae1"));
    console.log(await getRank("d6e2b71a-0d50-4e1f-a9d1-0591fe524ae1")); */

    /* #-=-=-=-=-=-=-=-=-=-=-=-=-=-=-= Comandos -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=# */

    CommandHandler.set({
      name: Config.Settings.Commands[1].Name,
      run: async (
        bot,
        int,
        args,
        {
          slashCommand,
          prefixUsed,
          commandUsed,
          type,
          user,
          member,
          guild,
          channel,
          reply,
        }
      ) => {
        if (int.interaction === null) {
        } else {
          let data_2 = await SyncTemporal.findOne({
            id: int.user.id,
          }).exec();

          let check_1 = await Sync.findOne({ discord_id: int.user.id }).exec();
          let test = await Sync.find().exec();
          let test_2 = await SyncTemporal.find().exec();

          /* Check synced account */

          if ((check_1?.verified ?? false) === true) {
            let profile = await lookupName(check_1.uuid);
            let nick = profile?.name ?? check_1.nick;
            let embed = Utils.setupMessage({
              configPath: Config.Messages.Synchronized_Account,
              thumbnail:
                (Config?.Messages?.Synchronized_Account?.Syncing?.Thumbnail ??
                  false) === false
                  ? undefined
                  : Config.Messages.Synchronized_Account.Thumbnail,
              image:
                (Config?.Messages?.Synchronized_Account?.Image ?? false) ===
                false
                  ? undefined
                  : Config.Messages.Synchronized_Account.Image,
              variables: [
                ...Utils.userVariables(member, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
                { searchFor: /{nickname}/g, replaceWith: nick },
                { searchFor: /{discord_tag}/g, replaceWith: int.user.tag },
              ],
            });
            embed.ephemeral = true;
            reply(embed, { ephemeral: true });
            return;
          }
          /* Generate code/key */

          let key = generateCode();
          let checkKey = async () => {
            let keys = await Sync.find().exec();
            let keys_2 = await SyncTemporal.find().exec();

            let checkKeys = keys.find((i) => i.code === key);
            let checkKeys_2 = keys_2.find((i) => i.codigo === key);

            if (checkKeys || checkKeys_2) {
              let check = false;
              for (let i = 0; i < keys.length + 1 * 50; i++) {
                let newCode = generateCode();

                if (check === false) {
                  let newCodeCheck = keys.find((c) => c.code === newCode);
                  let newCodeCheck_2 = keys_2.find((c) => c.codigo === newCode);

                  if (!newCodeCheck && !newCodeCheck_2) {
                    check = true;
                    key = newCode;
                  }
                }
              }
            }
          };

          await checkKey();

          /* Give code */

          if (!data_2) {
            let date = `${Number(new Date() / 1000) + 600}`.split(".")[0];

            await SyncTemporal.create({
              codigo: key,
              date: `${date}`,
              id: int.user.id,
            });
            await Sync.create({
              code: key,
              codigo: key,
              discord_tag: int.user.tag,
              discord_id: int.user.id,
              guild_id: int.guild.id,
              uuid: "none",
              verified: false,
            });

            let embed = Utils.setupMessage({
              configPath: Config.Messages.Syncing,
              thumbnail:
                (Config?.Messages?.Syncing?.Thumbnail ?? false) === false
                  ? undefined
                  : Config.Messages.Syncing.Thumbnail,
              image:
                (Config?.Messages?.Syncing?.Image ?? false) === false
                  ? undefined
                  : Config.Messages.Syncing.Image,
              variables: [
                ...Utils.userVariables(member, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
                { searchFor: /{date}/g, replaceWith: date },
                { searchFor: /{code}/g, replaceWith: key },
                { searchFor: /{discord_tag}/g, replaceWith: int.user.tag },
              ],
            });
            embed.ephemeral = true;
            reply(embed, { ephemeral: true });
          } else {
            let date = data_2.date;
            let code = data_2.codigo;

            let embed = Utils.setupMessage({
              configPath: Config.Messages.Syncing,
              thumbnail:
                (Config?.Messages?.Syncing?.Thumbnail ?? false) === false
                  ? undefined
                  : Config.Messages.Syncing.Thumbnail,
              image:
                (Config?.Messages?.Syncing?.Image ?? false) === false
                  ? undefined
                  : Config.Messages.Syncing.Image,
              variables: [
                ...Utils.userVariables(member, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
                { searchFor: /{date}/g, replaceWith: date },
                { searchFor: /{code}/g, replaceWith: code },
                { searchFor: /{discord_tag}/g, replaceWith: int.user.tag },
              ],
            });
            embed.ephemeral = true;
            reply(embed, { ephemeral: true });
          }
        }
      },
      description: Config.Settings.Commands[1].Description,
      usage: Config.Settings.Commands[1].Usage,
      arguments: [],
      aliases: [],
      type: "advanced-minecraft",
    });
    CommandHandler.set({
      name: Config.Settings.Commands[0].Name,
      run: async (
        bot,
        int,
        args,
        {
          slashCommand,
          prefixUsed,
          commandUsed,
          type,
          user_test,
          member,
          guild,
          channel,
          reply,
        }
      ) => {
        if (int.interaction === null) {
        } else {
          let user = int.options.getUser("user") || member;

          let data = await Sync.findOne({
            discord_id: user.id,
            verified: true,
          });

          if (!data) {
            let embed = Utils.setupMessage({
              configPath: Config.Messages.Not_Synchronized,
              thumbnail:
                (Config?.Messages?.Not_Synchronized?.Thumbnail ?? false) ==
                false
                  ? undefined
                  : Config.Messages.Not_Synchronized.Thumbnail,
              image:
                (Config?.Messages?.Not_Synchronized?.Thumbnail ?? false) ==
                false
                  ? undefined
                  : Config.Messages.Not_Synchronized.Image,
              variables: [
                ...Utils.userVariables(user, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
              ],
            });
            embed.ephemeral = true;
            reply(embed, { ephemeral: true });
            return;
          } else {
            let profile = await lookupName(data.uuid);
            if ((profile?.name ?? false) === false) {
              profile = {
                name: data.nick,
                id: data.uuid.replaceAll("-", ""),
              };
            }

            let rank;

            if (storageLP === true) {
              rank = await getRank(profile.raw_id);
            } else {
              rank = "DEFAULT";
            }

            let embed = Utils.setupMessage({
              configPath: Config.Messages.Profile,
              thumbnail:
                (Config?.Messages?.Profile?.Thumbnail ?? false) == false
                  ? undefined
                  : Config.Messages.Profile.Thumbnail,
              image:
                (Config?.Messages?.Profile?.Thumbnail ?? false) == false
                  ? undefined
                  : Config.Messages.Profile.Image,
              variables: [
                ...Utils.userVariables(user, "user"),
                {
                  searchFor: /{bot-pfp}/g,
                  replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                },
                {
                  searchFor: /{nickname}/g,
                  replaceWith: profile.name,
                },
                {
                  searchFor: /{uuid}/g,
                  replaceWith: profile.id,
                },
                {
                  searchFor: /{skin_body-pfp}/g,
                  replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                },
                {
                  searchFor: /{skin_body_2-pfp}/g,
                  replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                },
                {
                  searchFor: /{skin-pfp}/g,
                  replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                },
                {
                  searchFor: /{rank}/g,
                  replaceWith: rank || "DEFAULT",
                },
              ],
            });
            if (storageLB === false) embed.components = [];
            reply(embed);

            let filter = (i) => i.user.id === int.user.id;
            let collector = int.channel.createMessageComponentCollector({
              filter: filter,
              time: 180000,
            });

            collector.on("collect", async (i) => {
              if (i.customId === "mcprofile_1") {
                let bans =
                  Array.isArray(await getBans(profile.raw_id)) === false
                    ? []
                    : await getBans(profile.raw_id);
                let kicks =
                  Array.isArray(await getKicks(profile.raw_id)) === false
                    ? []
                    : await getKicks(profile.raw_id);
                let mutes =
                  Array.isArray(await getMutes(profile.raw_id)) === false
                    ? []
                    : await getMutes(profile.raw_id);
                let warnings =
                  Array.isArray(await getWarnings(profile.raw_id)) === false
                    ? []
                    : await getWarnings(profile.raw_id);
                let total_punishments =
                  bans.length + kicks.length + mutes.length + warnings.length;

                if (storageLP === true) {
                  rank = await getRank(profile.raw_id);
                } else {
                  rank = "DEFAULT";
                }

                let embed = Utils.setupMessage({
                  configPath: Config.Messages.History,
                  thumbnail:
                    (Config?.Messages?.History?.Thumbnail ?? false) == false
                      ? undefined
                      : Config.Messages.History.Thumbnail,
                  image:
                    (Config?.Messages?.History?.Thumbnail ?? false) == false
                      ? undefined
                      : Config.Messages.History.Image,
                  variables: [
                    ...Utils.userVariables(user, "user"),
                    {
                      searchFor: /{bot-pfp}/g,
                      replaceWith: bot.user.displayAvatarURL({ dynamic: true }),
                    },
                    {
                      searchFor: /{nickname}/g,
                      replaceWith: profile.name,
                    },
                    {
                      searchFor: /{uuid}/g,
                      replaceWith: profile.id,
                    },
                    {
                      searchFor: /{bans}/g,
                      replaceWith: bans.length,
                    },
                    {
                      searchFor: /{kicks}/g,
                      replaceWith: kicks.length,
                    },
                    {
                      searchFor: /{mutes}/g,
                      replaceWith: mutes.length,
                    },
                    {
                      searchFor: /{warnings}/g,
                      replaceWith: warnings.length,
                    },
                    {
                      searchFor: /{total_punishments}/g,
                      replaceWith: total_punishments,
                    },
                    {
                      searchFor: /{skin-pfp}/g,
                      replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                    },
                    {
                      searchFor: /{rank}/g,
                      replaceWith: rank || "DEFAULT",
                    },
                  ],
                });
                embed.ephemeral = true;
                await i.reply(embed);

                filter = (i) => i.user.id === int.user.id;
                collector = int.channel.createMessageComponentCollector({
                  filter: filter,
                  time: 180000,
                });

                collector.on("collect", async (c) => {
                  if (c.customId === "mcbans") {
                    let page = 1;
                    if (bans.length <= 0) {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Bans.None,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);
                      return;
                    } else {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Bans.History,
                        thumbnail:
                          (Config?.Messages?.Bans?.History?.Thumbnail ??
                            false) == false
                            ? undefined
                            : Config.Messages.Bans.History.Thumbnail,
                        image:
                          (Config?.Messages?.Bans?.History?.Image ?? false) ==
                          false
                            ? undefined
                            : Config.Messages.Bans.History.Image,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{banned_by_skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${
                              bans[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{banned_by_skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              bans[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{banned_by_skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              bans[page - 1].banned_by_uuid
                            }.png?y=-45`,
                          },
                          {
                            searchFor: /{banned_by}/g,
                            replaceWith: `${bans[page - 1].banned_by_name}`,
                          },
                          {
                            searchFor: /{date}/g,
                            replaceWith: `<t:${
                              `${bans[page - 1].time / 1000}`.split(".")[0]
                            }>`,
                          },
                          {
                            searchFor: /{reason}/g,
                            replaceWith: `${
                              bans[page - 1].reason || "No Reason"
                            }`,
                          },
                          {
                            searchFor: /{active}/g,
                            replaceWith: `${
                              `${bans[page - 1].active}` == "<Buffer 01>"
                                ? "🟢"
                                : "🔴"
                            }`,
                          },
                          {
                            searchFor: /{server}/g,
                            replaceWith: `${
                              bans[page - 1].server_origin || "Not Found"
                            }`,
                          },
                          {
                            searchFor: /{id}/g,
                            replaceWith: `${bans[page - 1].id}`,
                          },
                          {
                            searchFor: /{page}/g,
                            replaceWith: `${page}`,
                          },
                          {
                            searchFor: /{total_pages}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);

                      filter = (i) => i.user.id === int.user.id;
                      collector = int.channel.createMessageComponentCollector({
                        filter: filter,
                        time: 180000,
                      });

                      collector.on("collect", async (o) => {
                        if (o.customId === "page_1") {
                          await o.deferUpdate();
                          --page;
                          if (page === 0) page = 1;
                          if (page >= bans.length) page = bans.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Bans.History,
                            thumbnail:
                              (Config?.Messages?.Bans?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Bans.History.Thumbnail,
                            image:
                              (Config?.Messages?.Bans?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Bans.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{banned_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  bans[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{banned_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  bans[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{banned_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  bans[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{banned_by}/g,
                                replaceWith: `${bans[page - 1].banned_by_name}`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${bans[page - 1].time / 1000}`.split(".")[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  bans[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${bans[page - 1].active}` == "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  bans[page - 1].server_origin || "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${bans[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        } else if (o.customId === "page_2") {
                          await o.deferUpdate();
                          page++;
                          if (page === 0) page = 1;
                          if (page >= bans.length) page = bans.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Bans.History,
                            thumbnail:
                              (Config?.Messages?.Bans?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Bans.History.Thumbnail,
                            image:
                              (Config?.Messages?.Bans?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Bans.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{banned_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  bans[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{banned_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  bans[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{banned_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  bans[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{banned_by}/g,
                                replaceWith: `${bans[page - 1].banned_by_name}`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${bans[page - 1].time / 1000}`.split(".")[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  bans[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${bans[page - 1].active}` == "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  bans[page - 1].server_origin || "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${bans[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        }
                      });
                    }
                  } else if (c.customId === "mckicks") {
                    let page = 1;
                    if (kicks.length <= 0) {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Kicks.None,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);
                      return;
                    } else {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Kicks.History,
                        thumbnail:
                          (Config?.Messages?.Kicks?.History?.Thumbnail ??
                            false) == false
                            ? undefined
                            : Config.Messages.Kicks.History.Thumbnail,
                        image:
                          (Config?.Messages?.Kicks?.History?.Image ?? false) ==
                          false
                            ? undefined
                            : Config.Messages.Kicks.History.Image,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{kicked_by_skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${
                              kicks[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{kicked_by_skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              kicks[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{kicked_by_skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              kicks[page - 1].banned_by_uuid
                            }.png?y=-45`,
                          },
                          {
                            searchFor: /{kicked_by}/g,
                            replaceWith: `${kicks[page - 1].banned_by_name}`,
                          },
                          {
                            searchFor: /{date}/g,
                            replaceWith: `<t:${
                              `${kicks[page - 1].time / 1000}`.split(".")[0]
                            }>`,
                          },
                          {
                            searchFor: /{reason}/g,
                            replaceWith: `${
                              kicks[page - 1].reason || "No Reason"
                            }`,
                          },
                          {
                            searchFor: /{active}/g,
                            replaceWith: `${
                              `${kicks[page - 1].active}` == "<Buffer 01>"
                                ? "🟢"
                                : "🔴"
                            }`,
                          },
                          {
                            searchFor: /{server}/g,
                            replaceWith: `${
                              kicks[page - 1].server_origin || "Not Found"
                            }`,
                          },
                          {
                            searchFor: /{id}/g,
                            replaceWith: `${kicks[page - 1].id}`,
                          },
                          {
                            searchFor: /{page}/g,
                            replaceWith: `${page}`,
                          },
                          {
                            searchFor: /{total_pages}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);

                      filter = (i) => i.user.id === int.user.id;
                      collector = int.channel.createMessageComponentCollector({
                        filter: filter,
                        time: 180000,
                      });

                      collector.on("collect", async (o) => {
                        if (o.customId === "page_3") {
                          await o.deferUpdate();
                          --page;
                          if (page === 0) page = 1;
                          if (page >= kicks.length) page = kicks.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Kicks.History,
                            thumbnail:
                              (Config?.Messages?.Kicks?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Kicks.History.Thumbnail,
                            image:
                              (Config?.Messages?.Kicks?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Kicks.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{kicked_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  kicks[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{kicked_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  kicks[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{kicked_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  kicks[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{kicked_by}/g,
                                replaceWith: `${
                                  kicks[page - 1].banned_by_name
                                }`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${kicks[page - 1].time / 1000}`.split(".")[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  kicks[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${kicks[page - 1].active}` == "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  kicks[page - 1].server_origin || "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${kicks[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        } else if (o.customId === "page_4") {
                          await o.deferUpdate();
                          page++;
                          if (page === 0) page = 1;
                          if (page >= kicks.length) page = kicks.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Kicks.History,
                            thumbnail:
                              (Config?.Messages?.Kicks?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Kicks.History.Thumbnail,
                            image:
                              (Config?.Messages?.Kicks?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Kicks.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{kicked_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  kicks[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{kicked_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  kicks[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{kicked_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  kicks[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{kicked_by}/g,
                                replaceWith: `${
                                  kicks[page - 1].banned_by_name
                                }`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${kicks[page - 1].time / 1000}`.split(".")[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  kicks[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${kicks[page - 1].active}` == "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  kicks[page - 1].server_origin || "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${kicks[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        }
                      });
                    }
                  } else if (c.customId === "mcwarns") {
                    let page = 1;
                    if (warnings.length <= 0) {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Warnings.None,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);
                      return;
                    } else {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Warnings.History,
                        thumbnail:
                          (Config?.Messages?.Warnings?.History?.Thumbnail ??
                            false) == false
                            ? undefined
                            : Config.Messages.Warnings.History.Thumbnail,
                        image:
                          (Config?.Messages?.Warnings?.History?.Image ??
                            false) == false
                            ? undefined
                            : Config.Messages.Warnings.History.Image,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{warned_by_skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${
                              warnings[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{warned_by_skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              warnings[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{warned_by_skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              warnings[page - 1].banned_by_uuid
                            }.png?y=-45`,
                          },
                          {
                            searchFor: /{warned_by}/g,
                            replaceWith: `${warnings[page - 1].banned_by_name}`,
                          },
                          {
                            searchFor: /{date}/g,
                            replaceWith: `<t:${
                              `${warnings[page - 1].time / 1000}`.split(".")[0]
                            }>`,
                          },
                          {
                            searchFor: /{reason}/g,
                            replaceWith: `${
                              warnings[page - 1].reason || "No Reason"
                            }`,
                          },
                          {
                            searchFor: /{active}/g,
                            replaceWith: `${
                              `${warnings[page - 1].active}` == "<Buffer 01>"
                                ? "🟢"
                                : "🔴"
                            }`,
                          },
                          {
                            searchFor: /{server}/g,
                            replaceWith: `${
                              warnings[page - 1].server_origin || "Not Found"
                            }`,
                          },
                          {
                            searchFor: /{id}/g,
                            replaceWith: `${warnings[page - 1].id}`,
                          },
                          {
                            searchFor: /{page}/g,
                            replaceWith: `${page}`,
                          },
                          {
                            searchFor: /{total_pages}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);

                      filter = (i) => i.user.id === int.user.id;
                      collector = int.channel.createMessageComponentCollector({
                        filter: filter,
                        time: 180000,
                      });

                      collector.on("collect", async (o) => {
                        if (o.customId === "page_5") {
                          await o.deferUpdate();
                          --page;
                          if (page === 0) page = 1;
                          if (page >= warnings.length) page = warnings.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Warnings.History,
                            thumbnail:
                              (Config?.Messages?.Warnings?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Warnings.History.Thumbnail,
                            image:
                              (Config?.Messages?.Warnings?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Warnings.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{warned_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  warnings[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{warned_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  warnings[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{warned_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  warnings[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{warned_by}/g,
                                replaceWith: `${
                                  warnings[page - 1].banned_by_name
                                }`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${warnings[page - 1].time / 1000}`.split(
                                    "."
                                  )[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  warnings[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${warnings[page - 1].active}` ==
                                  "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  warnings[page - 1].server_origin ||
                                  "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${warnings[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        } else if (o.customId === "page_6") {
                          await o.deferUpdate();
                          page++;
                          if (page === 0) page = 1;
                          if (page >= warnings.length) page = warnings.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Warnings.History,
                            thumbnail:
                              (Config?.Messages?.Warnings?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Warnings.History.Thumbnail,
                            image:
                              (Config?.Messages?.Warnings?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Warnings.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{warned_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  warnings[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{warned_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  warnings[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{warned_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  warnings[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{warned_by}/g,
                                replaceWith: `${
                                  warnings[page - 1].banned_by_name
                                }`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${warnings[page - 1].time / 1000}`.split(
                                    "."
                                  )[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  warnings[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${warnings[page - 1].active}` ==
                                  "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  warnings[page - 1].server_origin ||
                                  "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${warnings[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        }
                      });
                    }
                  } else if (c.customId === "mcmutes") {
                    let page = 1;
                    if (mutes.length <= 0) {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Mutes.None,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);
                      return;
                    } else {
                      embed = Utils.setupMessage({
                        configPath: Config.Messages.Mutes.History,
                        thumbnail:
                          (Config?.Messages?.Mutes?.History?.Thumbnail ??
                            false) == false
                            ? undefined
                            : Config.Messages.Mutes.History.Thumbnail,
                        image:
                          (Config?.Messages?.Mutes?.History?.Image ?? false) ==
                          false
                            ? undefined
                            : Config.Messages.Mutes.History.Image,
                        variables: [
                          ...Utils.userVariables(user, "user"),
                          {
                            searchFor: /{bot-pfp}/g,
                            replaceWith: bot.user.displayAvatarURL({
                              dynamic: true,
                            }),
                          },
                          {
                            searchFor: /{muted_by_skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${
                              mutes[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{muted_by_skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              mutes[page - 1].banned_by_uuid
                            }.png`,
                          },
                          {
                            searchFor: /{muted_by_skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${
                              mutes[page - 1].banned_by_uuid
                            }.png?y=-45`,
                          },
                          {
                            searchFor: /{muted_by}/g,
                            replaceWith: `${mutes[page - 1].banned_by_name}`,
                          },
                          {
                            searchFor: /{date}/g,
                            replaceWith: `<t:${
                              `${mutes[page - 1].time / 1000}`.split(".")[0]
                            }>`,
                          },
                          {
                            searchFor: /{reason}/g,
                            replaceWith: `${
                              mutes[page - 1].reason || "No Reason"
                            }`,
                          },
                          {
                            searchFor: /{active}/g,
                            replaceWith: `${
                              `${mutes[page - 1].active}` == "<Buffer 01>"
                                ? "🟢"
                                : "🔴"
                            }`,
                          },
                          {
                            searchFor: /{server}/g,
                            replaceWith: `${
                              mutes[page - 1].server_origin || "Not Found"
                            }`,
                          },
                          {
                            searchFor: /{id}/g,
                            replaceWith: `${mutes[page - 1].id}`,
                          },
                          {
                            searchFor: /{page}/g,
                            replaceWith: `${page}`,
                          },
                          {
                            searchFor: /{total_pages}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{nickname}/g,
                            replaceWith: profile.name,
                          },
                          {
                            searchFor: /{uuid}/g,
                            replaceWith: profile.id,
                          },
                          {
                            searchFor: /{bans}/g,
                            replaceWith: bans.length,
                          },
                          {
                            searchFor: /{kicks}/g,
                            replaceWith: kicks.length,
                          },
                          {
                            searchFor: /{mutes}/g,
                            replaceWith: mutes.length,
                          },
                          {
                            searchFor: /{warnings}/g,
                            replaceWith: warnings.length,
                          },
                          {
                            searchFor: /{total_punishments}/g,
                            replaceWith: total_punishments,
                          },
                          {
                            searchFor: /{skin-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{skin_body-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                          },
                          {
                            searchFor: /{skin_body_2-pfp}/g,
                            replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                          },
                          {
                            searchFor: /{rank}/g,
                            replaceWith: `Not found`,
                          },
                        ],
                      });
                      embed.ephemeral = true;
                      await c.reply(embed);

                      filter = (i) => i.user.id === int.user.id;
                      collector = int.channel.createMessageComponentCollector({
                        filter: filter,
                        time: 180000,
                      });

                      collector.on("collect", async (o) => {
                        if (o.customId === "page_3") {
                          await o.deferUpdate();
                          --page;
                          if (page === 0) page = 1;
                          if (page >= mutes.length) page = mutes.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Mutes.History,
                            thumbnail:
                              (Config?.Messages?.Mutes?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Mutes.History.Thumbnail,
                            image:
                              (Config?.Messages?.Mutes?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Mutes.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{muted_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  mutes[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{muted_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  mutes[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{muted_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  mutes[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{muted_by}/g,
                                replaceWith: `${
                                  mutes[page - 1].banned_by_name
                                }`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${mutes[page - 1].time / 1000}`.split(".")[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  mutes[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${mutes[page - 1].active}` == "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  mutes[page - 1].server_origin || "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${mutes[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        } else if (o.customId === "page_4") {
                          await o.deferUpdate();
                          page++;
                          if (page === 0) page = 1;
                          if (page >= mutes.length) page = mutes.length;
                          embed = Utils.setupMessage({
                            configPath: Config.Messages.Mutes.History,
                            thumbnail:
                              (Config?.Messages?.Mutes?.History?.Thumbnail ??
                                false) == false
                                ? undefined
                                : Config.Messages.Mutes.History.Thumbnail,
                            image:
                              (Config?.Messages?.Mutes?.History?.Image ??
                                false) == false
                                ? undefined
                                : Config.Messages.Mutes.History.Image,
                            variables: [
                              ...Utils.userVariables(user, "user"),
                              {
                                searchFor: /{bot-pfp}/g,
                                replaceWith: bot.user.displayAvatarURL({
                                  dynamic: true,
                                }),
                              },
                              {
                                searchFor: /{muted_by_skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${
                                  mutes[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{muted_by_skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  mutes[page - 1].banned_by_uuid
                                }.png`,
                              },
                              {
                                searchFor: /{muted_by_skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${
                                  mutes[page - 1].banned_by_uuid
                                }.png?y=-45`,
                              },
                              {
                                searchFor: /{muted_by}/g,
                                replaceWith: `${
                                  mutes[page - 1].banned_by_name
                                }`,
                              },
                              {
                                searchFor: /{date}/g,
                                replaceWith: `<t:${
                                  `${mutes[page - 1].time / 1000}`.split(".")[0]
                                }>`,
                              },
                              {
                                searchFor: /{reason}/g,
                                replaceWith: `${
                                  mutes[page - 1].reason || "No Reason"
                                }`,
                              },
                              {
                                searchFor: /{active}/g,
                                replaceWith: `${
                                  `${mutes[page - 1].active}` == "<Buffer 01>"
                                    ? "🟢"
                                    : "🔴"
                                }`,
                              },
                              {
                                searchFor: /{server}/g,
                                replaceWith: `${
                                  mutes[page - 1].server_origin || "Not Found"
                                }`,
                              },
                              {
                                searchFor: /{id}/g,
                                replaceWith: `${mutes[page - 1].id}`,
                              },
                              {
                                searchFor: /{page}/g,
                                replaceWith: `${page}`,
                              },
                              {
                                searchFor: /{total_pages}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{nickname}/g,
                                replaceWith: profile.name,
                              },
                              {
                                searchFor: /{uuid}/g,
                                replaceWith: profile.id,
                              },
                              {
                                searchFor: /{bans}/g,
                                replaceWith: bans.length,
                              },
                              {
                                searchFor: /{kicks}/g,
                                replaceWith: kicks.length,
                              },
                              {
                                searchFor: /{mutes}/g,
                                replaceWith: mutes.length,
                              },
                              {
                                searchFor: /{warnings}/g,
                                replaceWith: warnings.length,
                              },
                              {
                                searchFor: /{total_punishments}/g,
                                replaceWith: total_punishments,
                              },
                              {
                                searchFor: /{skin-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/head/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png`,
                              },
                              {
                                searchFor: /{skin_body_2-pfp}/g,
                                replaceWith: `https://visage.surgeplay.com/full/512/${profile.id}.png?y=-45`,
                              },
                              {
                                searchFor: /{rank}/g,
                                replaceWith: `Not found`,
                              },
                            ],
                          });
                          embed.ephemeral = true;
                          await c.editReply(embed);
                        }
                      });
                    }
                  }
                });
              }
            });
          }
        }
      },
      description: Config.Settings.Commands[0].Description,
      usage: Config.Settings.Commands[0].Usage,
      aliases: [],
      type: "advanced-minecraft",
      arguments: [
        {
          name: Config.Settings.Commands[0].Arguments.Name,
          description: Config.Settings.Commands[0].Arguments.Description,
          required: false,
          type: "USER",
        },
      ],
    });
  },
  dependencies: [],
  configs: {
    config: {
      License: "XXXXXXX-XXXXXXX-XXXXXXX-XXXXXXX",
      LicenseValidation: {
        Endpoint: "https://your-license-server.example/api/licenses",
        ApiKey: "CHANGE_ME",
      },
      Settings: {
        Commands: [
          {
            Name: "mcprofile",
            Description: "View your minecraft profile or that of another user.",
            Usage: "/mcprofile",
            Arguments: {
              Name: "user",
              Description:
                "The user you want to sync your minecraft account with",
            },
          },
          {
            Name: "sync",
            Description:
              "Link your minecraft account with your discord account.",
            Usage: "/sync",
          },
        ],
        Verified: {
          Role: "verified-minecraft",
          Channel: "logs",
        },
      },
      Database: {
        Sync: {
          Storage: "MongoDB",
          Options: {
            Mongo: {
              Connect: "mongodb://127.0.0.1:27017/",
              Database: "advanced_minecraft",
              Collection: "sync",
            },
            SQL: {
              Address: "127.0.0.1",
              Database: "advanced_minecraft",
              Username: "root",
              Password: "CHANGE_ME",
              Port: 3306,
            },
          },
        },
        LiteBans: {
          Enabled: true,
          Host: "host",
          Database: "database_name",
          User: "user",
          Password: "CHANGE_ME",
          Table: "litebans",
          TablePrefix: `litebans_`,
          Port: 3306,
        },
        LuckPerms: {
          Enabled: true,
          Host: "host",
          Database: "database_name",
          User: "user",
          Password: "CHANGE_ME",
          Port: 3306,
        },
      },
      Messages: {
        Synchronized_Account: {
          Author: "Synchronized account!",
          AuthorIcon:
            "https://media.discordapp.net/attachments/734838674805620817/1070370089381150841/937977155781009438.webp",
          Description:
            "It looks like your discord account is already synced with our minecraft server, you are synced with **{nickname}** (`{discord_tag}`)",
          Timestamp: true,
        },
        Syncing: {
          Author: "Synchronization system",
          AuthorIcon:
            "https://media.discordapp.net/attachments/734838674805620817/1070371535132557322/937977155814559785.webp",
          Description:
            "To synchronize your account put the following command on our minecraft server.\n`/sync {code}`",
          Timestamp: true,
          Fields: [
            { Name: "Code", Value: "{code}", Inline: true },
            { Name: "Expires", Value: "<t:{date}>", Inline: true },
          ],
        },
        Not_Synchronized: {
          Author: "Account not synchronized!",
          AuthorIcon:
            "https://media.discordapp.net/attachments/734838674805620817/1070370089381150841/937977155781009438.webp",
          Description:
            "This discord account has not been synced (`{user-tag}`), if you want to synced your account you can use the /sync command in discord and synchronize your account with the minecraft account.",
          Timestamp: true,
        },
        Verified: {
          Logs: {
            Author: "Synchronization system",
            AuthorIcon:
              "https://media.discordapp.net/attachments/948002408120873001/1076270439145406535/minecraft-1-logo-png-transparent.png",
            Description: "New user verified with the synchronization system.",
            Timestamp: true,
            Fields: [
              { Name: "Nickname", Value: "{nickname}", Inline: true },
              { Name: "UUID", Value: "{uuid}", Inline: true },
              { Name: "Date", Value: "<t:{date}>", Inline: true },
              { Name: "Discord ID", Value: "{discord_id}", Inline: true },
              { Name: "Discord Tag", Value: "{discord_tag}", Inline: true },
              {
                Name: "Discord Mention",
                Value: "{discord_mention}",
                Inline: true,
              },
            ],
          },
          DM: {
            Author: "Synchronization system",
            AuthorIcon:
              "https://media.discordapp.net/attachments/948002408120873001/1076270439145406535/minecraft-1-logo-png-transparent.png",
            Description:
              "Thank you for syncing your minecraft account, **{nickname}**!",
            Timestamp: true,
            Fields: [
              { Name: "Nickname", Value: "{nickname}", Inline: true },
              { Name: "UUID", Value: "{uuid}", Inline: true },
              { Name: "Date", Value: "<t:{date}>", Inline: true },
            ],
          },
        },
        Profile: {
          Author: "{user-username}",
          AuthorIcon: "{user-pfp}",
          Fields: [
            { Name: "• Nickname", Value: "> {nickname}", Inline: true },
            { Name: "• UUID", Value: "> {uuid}", Inline: true },
            { Name: "• Rank", Value: "> {rank}", Inline: true },
          ],
          Timestamp: true,
          Thumbnail: "{skin-pfp}",
          Components: [
            [
              {
                ID: "mcprofile_1",
                Label: "View History",
                Style: "PRIMARY",
                Emoji: {
                  Emoji: "📋",
                  Enabled: true,
                },
              },
            ],
          ],
        },
        History: {
          Author: "{user-username}",
          AuthorIcon: "{user-pfp}",
          Description: "Here you can see all the user's punishments history.",
          Fields: [
            {
              Name: "• Bans",
              Value: "> {bans}",
              Inline: true,
            },
            {
              Name: "• Kicks",
              Value: "> {kicks}",
              Inline: true,
            },
            {
              Name: "• Mutes",
              Value: "> {mutes}",
              Inline: true,
            },
            {
              Name: "• Warnings",
              Value: "> {warnings}",
              Inline: true,
            },
            {
              Name: "• Total Punishments",
              Value: "> {total_punishments}",
              Inline: true,
            },
          ],
          Timestamp: true,
          Components: [
            [
              {
                ID: "mcbans",
                Label: "Bans",
                Style: "PRIMARY",
                Emoji: "📋",
              },
              {
                ID: "mckicks",
                Label: "Kicks",
                Style: "PRIMARY",
                Emoji: "📋",
              },
              {
                ID: "mcmutes",
                Label: "Mutes",
                Style: "PRIMARY",
                Emoji: "📋",
              },
              {
                ID: "mcwarns",
                Label: "Warns",
                Style: "PRIMARY",
                Emoji: "📋",
              },
            ],
          ],
        },
        Bans: {
          History: {
            Author: "{user-username}'s Bans History ({page}/{total_pages})",
            AuthorIcon: "{user-pfp}",
            Thumbnail: "{banned_by_skin_body_2-pfp}",
            Footer: "Page {page} of {total_pages}",
            Timestamp: true,
            Fields: [
              {
                Name: "• Banned by",
                Value: "> {banned_by}",
                Inline: true,
              },
              { Name: "• Date", Value: "> {date}", Inline: true },
              {
                Name: "• Reason",
                Value: "> {reason}",
                Inline: true,
              },
              {
                Name: "• Active",
                Value: "> {active}",
                Inline: true,
              },
              {
                Name: "• Server",
                Value: "> {server}",
                Inline: true,
              },
              { Name: "• ID", Value: "> {id}", Inline: true },
            ],
            Components: [
              [
                {
                  ID: "page_1",
                  Label: "⇐",
                  Style: "PRIMARY",
                },
                {
                  ID: "page_2",
                  Label: "⇒",
                  Style: "PRIMARY",
                },
              ],
            ],
          },
          None: {
            Author: "{user-username}",
            AuthorIcon: "{user-pfp}",
            Description: "The user has no bans.",
            Timestamp: true,
          },
        },
        Kicks: {
          History: {
            Author: "{user-username}'s Kicks History ({page}/{total_pages})",
            AuthorIcon: "{user-pfp}",
            Thumbnail: "{kicked_by_skin_body_2-pfp}",
            Footer: "Page {page} of {total_pages}",
            Timestamp: true,
            Fields: [
              {
                Name: "• Kicked by",
                Value: "> {kicked_by}",
                Inline: true,
              },
              {
                Name: "• Date",
                Value: "> {date}",
                Inline: true,
              },
              {
                Name: "• Reason",
                Value: "> {reason}",
                Inline: true,
              },
              {
                Name: "• Active",
                Value: "> {active}",
                Inline: true,
              },
              {
                Name: "• Server",
                Value: "> {server}",
                Inline: true,
              },
              { Name: "• ID", Value: "> {id}", Inline: true },
            ],
            Components: [
              [
                {
                  ID: "page_3",
                  Label: "⇐",
                  Style: "PRIMARY",
                },
                {
                  ID: "page_4",
                  Label: "⇒",
                  Style: "PRIMARY",
                },
              ],
            ],
          },
          None: {
            Author: "{user-username}",
            AuthorIcon: "{user-pfp}",
            Description: "The user has no kicks.",
            Timestamp: true,
          },
        },
        Mutes: {
          History: {
            Author: "{user-username}'s Mutes History ({page}/{total_pages})",
            AuthorIcon: "{user-pfp}",
            Thumbnail: "{muted_by_skin_body_2-pfp}",
            Footer: "Page {page} of {total_pages}",
            Timestamp: true,
            Fields: [
              {
                Name: "• Muted by",
                Value: "> {muted_by}",
                Inline: true,
              },
              {
                Name: "• Date",
                Value: "> {date}",
                Inline: true,
              },
              {
                Name: "• Reason",
                Value: "> {reason}",
                Inline: true,
              },
              {
                Name: "• Active",
                Value: "> {active}",
                Inline: true,
              },
              {
                Name: "• Server",
                Value: "> {server}",
                Inline: true,
              },
              { Name: "• ID", Value: "> {id}", Inline: true },
            ],
            Components: [
              [
                {
                  ID: "page_3",
                  Label: "⇐",
                  Style: "PRIMARY",
                },
                {
                  ID: "page_4",
                  Label: "⇒",
                  Style: "PRIMARY",
                },
              ],
            ],
          },
          None: {
            Author: "{user-username}",
            AuthorIcon: "{user-pfp}",
            Description: "The user has no mutes.",
            Timestamp: true,
          },
        },
        Warnings: {
          History: {
            Author: "{user-username}'s Warnings History ({page}/{total_pages})",
            AuthorIcon: "{user-pfp}",
            Thumbnail: "{warned_by_skin_body_2-pfp}",
            Footer: "Page {page} of {total_pages}",
            Timestamp: true,
            Fields: [
              {
                Name: "• Warned by",
                Value: "> {warned_by}",
                Inline: true,
              },
              {
                Name: "• Date",
                Value: "> {date}",
                Inline: true,
              },
              {
                Name: "• Reason",
                Value: "> {reason}",
                Inline: true,
              },
              {
                Name: "• Active",
                Value: "> {active}",
                Inline: true,
              },
              {
                Name: "• Server",
                Value: "> {server}",
                Inline: true,
              },
              { Name: "• ID", Value: "> {id}", Inline: true },
            ],
            Components: [
              [
                {
                  ID: "page_5",
                  Label: "⇐",
                  Style: "PRIMARY",
                },
                {
                  ID: "page_6",
                  Label: "⇒",
                  Style: "PRIMARY",
                },
              ],
            ],
          },
          None: {
            Author: "{user-username}",
            AuthorIcon: "{user-pfp}",
            Description: "The user has no warnings.",
            Timestamp: true,
          },
        },
      },
    },
  },
};
