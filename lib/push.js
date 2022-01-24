const admin = require('firebase-admin');
let serAccount = require('../config/ojtnative-firebase-adminsdk-yf337-ade33cc7a0.json');
var logger = require('../config/logger');
const _ = require('lodash');

admin.initializeApp({
    credential: admin.credential.cert(serAccount),
});

exports.pushMessage = function (token, title, body) {
    this.pushMessageArray([token], title, body);
};

/**
 * firebase를 활용하여, 푸시메세지를 발송한다.
 * @param {Array} tokenArray firebase token
 * @param {*} title 푸시 메세지 제목(위에 큰거)
 * @param {*} body 푸시 메세지 내용(밑에 작은거)
 */
exports.pushMessageArray = function (tokenArray, title, body) {
    var tokens = _.chunk(tokenArray, 500);
    for (var i = 0; i < tokens.length; i++) {
        const payload = {
            notification: {
                title: title,
                body: body,
            },
        };
        const options = {
            // 보낼때의 우선순위를 작성 high와 normal로 나뉜다. high가 먼저 ... 후에 또 검색해보기
            priority: 'normal',
            // 기기가 꺼져있을때 지정한 시간까지 보류해준다.
            timeToLive: 60 * 60 * 24,
        };

        admin
            .messaging()
            .sendToDevice(tokens[i], payload, options)
            .then(function (response) {
                logger.info('잘 보냈습니다 : ' + response);
            })
            .catch(function (err) {
                logger.error('에러에러! : ' + err);
            });
    }
};
