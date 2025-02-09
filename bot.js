const { Telegraf, Markup } = require('telegraf');
const fs = require('fs');

const TOKEN = "7733359265:AAFOs2Jqssu3T4oEnW0oPew7iPhK564PSUE";

const QUESTIONS = [
    {
        question: "ما هو ترتيب شهر رمضان في السنة الهجرية؟",
        options: ["7", "8", "9", "10"],
        answer: "9",
    },
    {
        question: "ما هو حكم صيام رمضان؟",
        options: ["مستحب", "واجب", "مكروه", "مباح"],
        answer: "واجب",
    },
    // ... باقي الأسئلة
];

let userProgress = {};
let userState = {};

const USER_DATA_FILE = "user_data.json";

async function deletePreviousMessages(chatId, messageIds, ctx) {
    for (const msgId of messageIds) {
        try {
            await ctx.deleteMessage(msgId);
        } catch (e) {
            // قد تكون الرسالة محذوفة بالفعل أو غير موجودة
        }
    }
}

function saveUserData() {
    fs.writeFileSync(USER_DATA_FILE, JSON.stringify({ userProgress, userState }));
}

function loadUserData() {
    try {
        const data = fs.readFileSync(USER_DATA_FILE);
        const parsedData = JSON.parse(data);
        userProgress = parsedData.userProgress || {};
        userState = parsedData.userState || {};
    } catch (e) {
        userProgress = {};
        userState = {};
    }
}

async function start(ctx) {
    const userId = ctx.from.id;
    userState[userId] = "start_menu";
    const keyboard = Markup.keyboard([["Start"]]).resize();

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply("مرحبا بك! اضغط على Start للبدء.", keyboard);
    userProgress[userId] = { messageIds: [message.message_id] };
    saveUserData();
}

async function toMainMenu(ctx) {
    const userId = ctx.from.id;
    userState[userId] = "main_menu";
    const keyboard = Markup.keyboard([
        ["الأسئلة 🧠"],
        ["الأذكار اليومية 🕋"],
        ["القرآن الكريم 📖"],
        ["الحديث النبوي 💫"],
        ["رجوع"],
    ]).resize();

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply("مرحبا بك عزيزي المستخدم! اختر أحد الخيارات من القائمة أدناه:", keyboard);
    userProgress[userId] = { messageIds: [message.message_id] };
    saveUserData();
}

async function backToStart(ctx) {
    const userId = ctx.from.id;
    userState[userId] = "start_menu";
    const keyboard = Markup.keyboard([["Start"]]).resize();

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply("تم العودة إلى القائمة الرئيسية.", keyboard);
    userProgress[userId] = { messageIds: [message.message_id] };
    saveUserData();
}

async function questionsHandler(ctx) {
    const userId = ctx.from.id;
    userProgress[userId] = { score: 0, currentQuestion: 0, attempts: 0, messageIds: [] };
    await sendQuestion(ctx.chat.id, userId, ctx);
}

async function remindersHandler(ctx) {
    const userId = ctx.from.id;
    userState[userId] = "reminders_menu";
    const keyboard = Markup.keyboard([
        ["أذكار الصباح 🌞"],
        ["أذكار المساء 🌙"],
        ["رجوع"],
    ]).resize();

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply("رجاء اختر من القائمة في الأسفل:", keyboard);
    userProgress[userId] = { messageIds: [message.message_id] };
    saveUserData();
}

async function showReminders(ctx) {
    const userId = ctx.from.id;
    const timeOfDay = ctx.message.text.split()[0];

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply(`هذا المحتوى غير موجود حاليًا (${timeOfDay}). سنخبركم عندما يتم إضافته.`);
    userProgress[userId] = { messageIds: [message.message_id] };

    const keyboard = Markup.keyboard([
        ["أذكار الصباح 🌞"],
        ["أذكار المساء 🌙"],
        ["رجوع"],
    ]).resize();
    await ctx.reply("اختر من القائمة أدناه:", keyboard);
    saveUserData();
}

async function quranHandler(ctx) {
    const userId = ctx.from.id;

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply("هذا المحتوى غير متوفر حاليًا، سيتم إعلامكم حين توفره.");
    userProgress[userId] = { messageIds: [message.message_id] };

    const keyboard = Markup.keyboard([
        ["الأسئلة 🧠"],
        ["الأذكار اليومية 🕋"],
        ["القرآن الكريم 📖"],
        ["الحديث النبوي 💫"],
        ["رجوع"],
    ]).resize();
    await ctx.reply("اختر من القائمة أدناه:", keyboard);
    saveUserData();
}

async function hadithHandler(ctx) {
    const userId = ctx.from.id;

    if (userProgress[userId]?.messageIds) {
        await deletePreviousMessages(ctx.chat.id, userProgress[userId].messageIds, ctx);
    }

    const message = await ctx.reply("هذا المحتوى غير متوفر حاليًا، سيتم إعلامكم حين توفره.");
    userProgress[userId] = { messageIds: [message.message_id] };

    const keyboard = Markup.keyboard([
        ["الأسئلة 🧠"],
        ["الأذكار اليومية 🕋"],
        ["القرآن الكريم 📖"],
        ["الحديث النبوي 💫"],
        ["رجوع"],
    ]).resize();
    await ctx.reply("اختر من القائمة أدناه:", keyboard);
    saveUserData();
}

async function sendQuestion(chatId, userId, ctx) {
    const userData = userProgress[userId];
    if (!userData) {
        await ctx.reply("يرجى العودة إلى القائمة الرئيسية.");
        return;
    }

    const currentQuestionIndex = userData.currentQuestion;
    if (currentQuestionIndex < QUESTIONS.length) {
        const questionData = QUESTIONS[currentQuestionIndex];
        const optionsMapping = questionData.options.map((option, index) => ({
            text: option,
            callback_data: `answer_${index}`,
        }));
        const keyboard = Markup.inlineKeyboard(optionsMapping);

        if (userData.messageIds) {
            await deletePreviousMessages(chatId, userData.messageIds, ctx);
        }

        const message = await ctx.reply(
            `❓ *السؤال ${currentQuestionIndex + 1}:*\n\n${questionData.question}`,
            { parse_mode: "Markdown", ...keyboard }
        );
        userData.messageIds = [message.message_id];
        userData.optionsMapping = optionsMapping;
    } else {
        const finalScore = userData.score;
        const totalQuestions = QUESTIONS.length;

        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback("العودة إلى القائمة الرئيسية", "back_to_main"),
        ]);

        if (userData.messageIds) {
            await deletePreviousMessages(chatId, userData.messageIds, ctx);
        }

        const message = await ctx.reply(
            `🎉 *لقد أكملت جميع الأسئلة!*\n\nالنتيجة النهائية: ${finalScore}/${totalQuestions}`,
            { parse_mode: "Markdown", ...keyboard }
        );
        userData.messageIds = [message.message_id];
    }
    saveUserData();
}

async function checkAnswer(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) {
        await ctx.reply("يرجى العودة إلى القائمة الرئيسية.");
        return;
    }

    const chosenOptionIndex = ctx.callbackQuery.data.split("_")[1];
    const chosenAnswer = userData.optionsMapping[chosenOptionIndex].text;
    const currentQuestionIndex = userData.currentQuestion;
    const correctAnswer = QUESTIONS[currentQuestionIndex].answer;

    if (chosenAnswer === correctAnswer) {
        const keyboard = Markup.inlineKeyboard([
            Markup.button.callback("المواصلة", "continue"),
        ]);

        if (userData.messageIds) {
            await deletePreviousMessages(ctx.chat.id, userData.messageIds, ctx);
        }

        const message = await ctx.reply("✅ *إجابة صحيحة!* تهانينا، يمكنك المتابعة إلى السؤال التالي.", {
            parse_mode: "Markdown",
            ...keyboard,
        });
        userData.messageIds = [message.message_id];
        userData.score += 1;
        userData.attempts = 0;
    } else {
        userData.attempts += 1;
        if (userData.attempts >= 3) {
            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback("المواصلة", "continue"),
            ]);

            if (userData.messageIds) {
                await deletePreviousMessages(ctx.chat.id, userData.messageIds, ctx);
            }

            const message = await ctx.reply(
                `💔 *لقد استنفذت جميع محاولاتك لهذا السؤال.*\n\n✅ الإجابة الصحيحة هي: ${correctAnswer}`,
                { parse_mode: "Markdown", ...keyboard }
            );
            userData.messageIds = [message.message_id];
            userData.attempts = 0;
        } else {
            const keyboard = Markup.inlineKeyboard([
                Markup.button.callback("إعادة المحاولة", "retry"),
            ]);

            if (userData.messageIds) {
                await deletePreviousMessages(ctx.chat.id, userData.messageIds, ctx);
            }

            const message = await ctx.reply("❌ *إجابة خاطئة!* حاول مرة أخرى.", {
                parse_mode: "Markdown",
                ...keyboard,
            });
            userData.messageIds = [message.message_id];
        }
    }
    saveUserData();
}

async function continueHandler(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) {
        await ctx.reply("يرجى العودة إلى القائمة الرئيسية.");
        return;
    }

    userData.currentQuestion += 1;
    await sendQuestion(ctx.chat.id, userId, ctx);
    saveUserData();
}

async function retryHandler(ctx) {
    const userId = ctx.from.id;
    const userData = userProgress[userId];
    if (!userData) {
        await ctx.reply("يرجى العودة إلى القائمة الرئيسية.");
        return;
    }

    await sendQuestion(ctx.chat.id, userId, ctx);
    saveUserData();
}

async function backToMainHandler(ctx) {
    const userId = ctx.from.id;
    userState[userId] = "main_menu";
    await toMainMenu(ctx);
    saveUserData();
}

const bot = new Telegraf(TOKEN);

loadUserData();

bot.start(start);
bot.hears("Start", toMainMenu);
bot.hears("رجوع", backToStart);
bot.hears("الأسئلة 🧠", questionsHandler);
bot.hears("الأذكار اليومية 🕋", remindersHandler);
bot.hears(/أذكار الصباح 🌞|أذكار المساء 🌙/, showReminders);
bot.hears("القرآن الكريم 📖", quranHandler);
bot.hears("الحديث النبوي 💫", hadithHandler);

bot.action(/answer_\d+/, checkAnswer);
bot.action("retry", retryHandler);
bot.action("continue", continueHandler);
bot.action("back_to_main", backToMainHandler);

bot.launch();
console.log("Bot started...");
