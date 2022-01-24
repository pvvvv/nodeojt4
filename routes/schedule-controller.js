var db = require('../models');
var moment = require('moment');
const logger = require('../config/logger');
const push = require('../lib/push');

exports.insertSchedule = async function (req, res, next) {
    var OP = db.Op;
    var statusNum;
    var success = {};
    var findMiddleSchedule;
    var { name, location, title, startDate, startTime, endDate, endTime, allday, id } = req.body;
    var category;
    var start = startDate + 'T' + startTime;
    var end = endDate + 'T' + endTime;

    logger.info(name + location + title + startDate + startTime + endDate + endTime + allday + id);

    if (allday === 'true') {
        category = 'allday';
        start = startDate + 'T08:00:00';
        end = startDate + 'T19:00:00';
    } else {
        category = 'time';
    }

    try {
        logger.info('0');
        findMiddleSchedule = await db.scheduler.findAll({
            where: {
                [OP.or]: [
                    {
                        startDate: {
                            [OP.gte]: start, // >=
                            [OP.lte]: end, // >=
                        },
                    },
                    {
                        endDate: {
                            [OP.gte]: start,
                            [OP.lte]: end,
                        },
                    },
                    db.sequelize.where(db.sequelize.literal("'" + start + "'"), {
                        [OP.between]: [db.sequelize.col('startDate'), db.sequelize.col('endDate')],
                    }),
                ],
                location: location,
            },
            order: [['startDate', 'asc']],
        });
        console.log('*****************');
        console.log(findMiddleSchedule);
        console.log(findMiddleSchedule.length);
        var oLength = Object.keys(findMiddleSchedule).length;

        if (category == 'allday' && oLength > 0) {
            logger.info('1');
            success.text = '종일 예약이 불가능한 시간입니다. 달력을 확인해주세요';
            statusNum = 206;
        } else if (category == 'time' && oLength > 0) {
            logger.info('2');
            success.text = '예약이 불가능한 시간입니다. 달력을 확인해주세요';
            statusNum = 206;
        } else if (oLength == 0) {
            logger.info('3');
            try {
                // 한번 더 묶어주지 않으면 에러페이지로 이동
                var insertSuccess = await db.scheduler.create({
                    id: id,
                    name: name,
                    title: title,
                    location: location,
                    category: category,
                    startDate: start,
                    endDate: end,
                });
                if (insertSuccess !== null) {
                    var findtoken = await db.user.findOne({
                        where: {
                            id: id,
                        },
                    });
                    var token = findtoken.token;

                    push.pushMessage(token, '축하드립니다', ' 회의실' + location + '가 ' + start + '에 예약되었습니다');
                    success.text = '성공';
                    statusNum = 200;
                } else {
                    success.text = '새로고침 후 다시 진행해주세요.';
                    statusNum = 400;
                }
            } catch (error) {
                next(error);
            }
        }
        res.status(statusNum).json({
            code: statusNum,
            message: success.text,
        });
    } catch (error) {
        next(error);
    }
};
