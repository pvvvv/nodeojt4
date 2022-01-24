const bat = require('node-schedule');
const logger = require('../config/logger');
const db = require('../models/');
const moment = require('moment');
const Op = db.Sequelize.Op;
const push = require('../lib/push');

module.exports = {
    schedulePush: async () => {
        // 0/10 * * * * *
        bat.scheduleJob('0/10 * * * * *', async () => {
            var time = moment().format('YYYY-MM-DD HH:mm');
            var together = {};
            var tokens = [];
            var endSchedule = await db.scheduler.findAll({
                where: {
                    endDate: time,
                },
            });
            try {
                //여러개가 나왔다!?
                if (endSchedule !== null) {
                    // 종료 스케줄이 몇갠지 판단
                    for (var i = 0; i < endSchedule.length; i++) {
                        together = endSchedule[i].together;
                        together += ',' + endSchedule[i].id;
                        var users = together.split(',');
                        //종료 스케줄의 인원의 토큰값을 빼오기위한 find
                        var findUsers = await db.user.findAll({ where: { id: users } });
                        //인원의 토큰값만 배열로 가져오기
                        for (var j = 0; j < findUsers.length; j++) {
                            tokens.push(findUsers[j].token);
                        }
                        push.pushMessageArray(
                            tokens,
                            '알림',
                            endSchedule.startDate + '에 시작한 회의가 종료되었습니다',
                        );
                    }
                } else {
                    return;
                }
            } catch (error) {
                logger.error(error);
            }
        });
    },
};
