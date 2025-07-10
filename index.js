        const { 
          Client, 
          GatewayIntentBits, 
          Partials, 
          Collection, 
          EmbedBuilder, 
          PermissionsBitField, 
          ButtonBuilder, 
          ActionRowBuilder, 
          ButtonStyle, 
          StringSelectMenuBuilder 
        } = require("discord.js");

        const client = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMembers
          ],
          partials: [Partials.Message, Partials.Channel, Partials.Reaction]
        });

        client.commands = new Collection();

        const prefix = '!'; // تقدر تغيره لو تبي

        // ======= أوامر الإدارة =======
        client.on("messageCreate", async (message) => {
          if (!message.guild || message.author.bot) return;

          const args = message.content.split(" ");
          const command = args[0].toLowerCase();

          // باند
          if (command === "لف") {
            if (!message.member.permissions.has("BanMembers")) return;
            const member = message.mentions.members.first();
            if (!member) return message.reply("منشن الشخص!");
            await member.ban();
            message.channel.send(`${member.user.tag} تم حظره.`);
          }

          // كيك
          if (command === "دز") {
            if (!message.member.permissions.has("KickMembers")) return;
            const member = message.mentions.members.first();
            if (!member) return message.reply("منشن الشخص!");
            await member.kick();
            message.channel.send(`${member.user.tag} تم طرده.`);
          }

          // ميوت
          if (command === "تايم") {
            if (!message.member.permissions.has("ModerateMembers")) return;
            const member = message.mentions.members.first();
            const time = args[2] || "1m";
            if (!member) return message.reply("منشن الشخص!");
            await member.timeout(60000); // 1 دقيقة مثال
            message.channel.send(`${member.user.tag} تم عمل تايم له.`);
          }

          // مسح
          if (command === "م") {
            if (!message.member.permissions.has("ManageMessages")) return;
            const count = parseInt(args[1]) || 10;
            await message.channel.bulkDelete(count, true);
            message.channel.send(`تم مسح ${count} رسالة`).then(msg => {
              setTimeout(() => msg.delete(), 3000);
            });
          }
        });

        // ======= نظام تذاكر =======
        client.on("ready", async () => {
          const channel = await client.channels.fetch("1390440604022083796"); // روم البانل
          const row = new ActionRowBuilder().addComponents(
            new StringSelectMenuBuilder()
              .setCustomId("select_ticket")
              .setPlaceholder("اختر نوع التذكرة")
              .addOptions([
                { label: "🎫 الدعم الفني", value: "support" },
                { label: "🛠️ الشكاوي", value: "complaint" },
                { label: "💰 الشراء", value: "buy" },
                { label: "🎉 الترفيه", value: "fun" }
              ])
          );
          const embed = new EmbedBuilder()
            .setTitle("نظام التذاكر")
            .setDescription("يرجى اختيار نوع التذكرة من القائمة")
            .setColor("Blue");

          await channel.send({ embeds: [embed], components: [row] });
        });

        client.on("interactionCreate", async (interaction) => {
          if (!interaction.isStringSelectMenu()) return;
          if (interaction.customId !== "select_ticket") return;

          const reasonAsk = await interaction.reply({ content: "يرجى كتابة سبب فتح التذكرة:", ephemeral: false });

          const collector = interaction.channel.createMessageCollector({
            filter: m => m.author.id === interaction.user.id,
            max: 1,
            time: 60000
          });

          collector.on("collect", async msg => {
            const reason = msg.content;
            const categoryId = "1390437959916064848"; // كاتغوري
            const supportRole = "1392888658301943949";

            const channel = await interaction.guild.channels.create({
              name: `ticket-${interaction.user.username}`,
              type: 0,
              parent: categoryId,
              permissionOverwrites: [
                {
                  id: interaction.guild.id,
                  deny: ["ViewChannel"]
                },
                {
                  id: interaction.user.id,
                  allow: ["ViewChannel", "SendMessages"]
                },
                {
                  id: supportRole,
                  allow: ["ViewChannel", "SendMessages"]
                }
              ]
            });

            const ticketEmbed = new EmbedBuilder()
              .setTitle("🎫 تذكرة جديدة")
              .setDescription(`**عن الفني**\nأهلاً وسهلاً بك\n\n**السبب:** ${reason}`)
              .setColor("Green")
              .setFooter({ text: `تم الفتح بواسطة ${interaction.user.tag}` });

            const buttons = new ActionRowBuilder().addComponents(
              new ButtonBuilder()
                .setCustomId("close_ticket")
                .setLabel("🔒 إغلاق")
                .setStyle(ButtonStyle.Danger),
              new ButtonBuilder()
                .setCustomId("claim_ticket")
                .setLabel("📩 استلام")
                .setStyle(ButtonStyle.Primary),
              new ButtonBuilder()
                .setCustomId("call_owner")
                .setLabel("👑 استدعاء أونر")
                .setStyle(ButtonStyle.Secondary),
              new ButtonBuilder()
                .setCustomId("call_support")
                .setLabel("📢 طلب سبورت")
                .setStyle(ButtonStyle.Success)
            );

            await channel.send({
              content: `<@&${supportRole}> | ${interaction.user}`,
              embeds: [ticketEmbed],
              components: [buttons]
            });
          });
        });

        client.on("interactionCreate", async (interaction) => {
          if (!interaction.isButton()) return;

          const supportRole = "1392888658301943949";

          if (interaction.customId === "close_ticket") {
            await interaction.channel.delete();
          }

          if (interaction.customId === "claim_ticket") {
            const embed = new EmbedBuilder()
              .setDescription(`تم استلام التذكرة بواسطة: ${interaction.user}`)
              .setColor("Blue");
            await interaction.update({ embeds: [embed], components: [] });
          }

          if (interaction.customId === "call_owner") {
            const owner = interaction.guild.ownerId;
            await interaction.reply({ content: `<@${owner}> تم استدعائك للتذكرة.`, ephemeral: false });
          }

          if (interaction.customId === "call_support") {
            await interaction.reply({ content: `<@&${supportRole}> Come Admins!`, ephemeral: false });
          }
        });

        // ======= أوامر الترفيه =======
        client.on("messageCreate", message => {
          if (message.content === `${prefix}نرد`) {
            const roll = Math.floor(Math.random() * 6) + 1;
            message.reply(`🎲 طلعت لك: ${roll}`);
          }

          if (message.content === `${prefix}حجرة`) {
            const choices = ["حجرة", "ورقة", "مقص"];
            const bot = choices[Math.floor(Math.random() * choices.length)];
            message.reply(`أنا اخترت: ${bot}`);
          }
        });

        // ======= أمر القرآن =======
        client.on("messageCreate", message => {
          if (message.content.startsWith(`${prefix}قرآن`)) {
            message.channel.send("📖 https://www.mp3quran.net/");
          }
        });

        // ======= أمر التقديم =======
        client.on("messageCreate", async message => {
          if (message.content === `${prefix}تقديم`) {
            const filter = m => m.author.id === message.author.id;
            let questions = ["اسمك؟", "عمرك؟", "لماذا تريد التقديم؟"];
            let collectedAnswers = [];

            for (let i = 0; i < questions.length; i++) {
              await message.channel.send(questions[i]);
              const collected = await message.channel.awaitMessages({ filter, max: 1, time: 60000 });
              if (!collected.size) return message.channel.send("انتهى الوقت.");
              collectedAnswers.push(collected.first().content);
            }

            const result = new EmbedBuilder()
              .setTitle("نموذج تقديم جديد")
              .addFields(
                { name: "الاسم", value: collectedAnswers[0] },
                { name: "العمر", value: collectedAnswers[1] },
                { name: "السبب", value: collectedAnswers[2] }
              )
              .setColor("Orange");

            const logChannel = message.guild.channels.cache.get("1390440604022083796");
            if (logChannel) logChannel.send({ embeds: [result] });

            message.channel.send("تم إرسال تقديمك.");
          }
        });

        // ======= تسجيل الدخول =======
        client.login(process.env.TOKEN);