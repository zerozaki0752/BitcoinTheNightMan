// Use AV.Cloud.define to define as many cloud functions as you want.
// For example:


//var Market = AV.Object.extend("Market");
var lock = require('avos-lock');
var User = AV.Object.extend('_User');
var UserFavicon = AV.Object.extend('UserFavicon');
var Installation = AV.Object.extend('_Installation');
var TradeHistory = AV.Object.extend('TradeHistory');
var MarketHistory = AV.Object.extend('MarketHistory');
var DepthHistory = AV.Object.extend('DepthHistory');
var Coin = AV.Object.extend('Coin');
var RequestController = AV.Object.extend('RequestController');

var coin1List = ['btc','btb','bqc','cnc','cent','cmc','doge','dtc','exc','ftc','frc','ifc','ltc','mec','nmc','ppc','pts','qrk','red','src','tag','tix','wdc','xpm','yac','zcc','zet'];

if (__production)
{
    var verNo = "1.3";
}

//jry bsc trc

var coin2List = ['cny'];

if (!__production){

//var lowPriceDataList = [];
//var highPriceDataList = [];

    AV.Cloud.define("hello", function(request, response) {
        response.success("Hello world!");
    });

    AV.Cloud.setInterval('coin_alert', 20, function(){

        lock.sync('coin_alert_sync', 20000, function(done){

            console.log('start');
            var requests = {};
            var lowPriceDataList = [];
            var highPriceDataList = [];

            for (var i=0;i<coin1List.length;i++)
            {
                var coin = coin1List[i];
                requests[coin] = coin;
            }

            //测试
//            var count = 0;
//            for (var i in requests)
//            {
//                count++;
//            }
//            if (!__production)
//                console.log('开始 : '+count);


            for (var i=0;i<coin1List.length;i++)
            {
                var coin = coin1List[i];
                alertRequest(requests, lowPriceDataList, highPriceDataList, coin, 'cny', done);
            }
        });
    });

    function isEmpty(obj)
    {
        return Object.keys(obj).length === 0;
    }

    function length(obj)
    {
        return Object.keys(obj).length;
    }

    //判断是否是数组的函数
    function isArray(obj)
    {
        //return obj && !(obj.propertyIsEnumerable('length')) && typeof obj === 'object' && typeof obj.length === 'number';
        if (obj instanceof Array)
        {

            if (obj.length)
            {
                if (!__production)
                    console.log('是长度不为0的数组');
                return true;
            }
            else
            {
                if (!__production)
                    console.log('长度为0');
                return false;
            }
        }
        else
        {
            if (!__production)
                console.log('不是数组');
            return false;
        }
    }

    function alertRequest(requests, lowPriceDataList, highPriceDataList, coin1, coin2, done)
    {
        var url = 'http://cn.bter.com/api/1/trade/'+coin1+'_'+coin2;
        //    console.log(url);
        AV.Cloud.httpRequest({
            url: url,
            success: function(httpResponse) {

                if(requests[coin1])
                {
                    var resultInfo;
                    try {
                        resultInfo = JSON.parse(httpResponse.text);

                        if (resultInfo.result)
                        {
                            //推送
                            var resultDataList = resultInfo.data;

                            if (!__production)
                                console.log('tid1 : '+resultDataList[resultDataList.length-1].tid);

                            var lowPrice = parseFloat(resultDataList[0].price);
                            var lowDate = resultDataList[0].date;
                            var lowTid = resultDataList[0].tid;

                            var highPrice = parseFloat(resultDataList[resultDataList.length-1].price);
                            var highDate = resultDataList[resultDataList.length-1].date;
                            var highTid = resultDataList[resultDataList.length-1].tid;

                            lowPriceDataList.push({'price':lowPrice,'coin1':coin1,'coin2':coin2,'date':lowDate,'tid':lowTid});
                            highPriceDataList.push({'price':highPrice,'coin1':coin1,'coin2':coin2,'date':highDate,'tid':highTid});

                            if (!__production)
                                console.log('增加 : '+ lowPriceDataList.length);

                            delete requests[coin1];

                            if (isEmpty(requests))
                            {
                                alertPush(lowPriceDataList,highPriceDataList,done);
                            }
                        }
                        else
                        {
                            delete requests[coin1];

                            if (isEmpty(requests))
                            {
                                alertPush(lowPriceDataList,highPriceDataList,done);
                            }
                        }
                    }
                    catch(error) {

                        console.dir(error);

                        delete requests[coin1];

                        if (isEmpty(requests))
                        {
                            alertPush(lowPriceDataList,highPriceDataList,done);
                        }
                    }
                }

            },
            error: function() {

                if(requests[coin1])
                {
                    delete requests[coin1];

                    if (isEmpty(requests))
                    {
                        try{

                            alertPush(lowPriceDataList,highPriceDataList,done);

                        }finally{

                            console.log('alert reuqest is done.');
                            done();
                        }
                    }
                }


            }
        });
    }

//    function alertRequest(requests, lowPriceDataList, highPriceDataList, coin1, coin2, done)
//    {
//        var url = 'http://cn.bter.com/api/1/trade/'+coin1+'_'+coin2;
//    //    console.log(url);
//        AV.Cloud.httpRequest({
//            url: url,
//            success: function(httpResponse) {
//
//                if(requests[coin1])
//                {
//                    var resultInfo;
//                    try {
//                        resultInfo = JSON.parse(httpResponse.text);
//
//    //                    resultInfo = JSON.parse(httpResponse.buffer.toString());
//
//                        if (resultInfo.result)
//                        {
//                            //二次请求
//                            var resultDataList = resultInfo.data;
//
//                            var lastTid = resultDataList[resultDataList.length-1].tid;
//
//                            if (!__production)
//                                console.log('tid0 : '+lastTid);
//
//                            var url2 = url + '/' + lastTid;
//
//                            AV.Cloud.httpRequest({
//                                url: url2,
//                                success: function(httpResponse) {
//
//                                    var resultInfo ;
//                                    try{
//                                        resultInfo = JSON.parse(httpResponse.text);
//
//                                        if (resultInfo.result)
//                                        {
//                                            //推送
//                                            var resultDataList = resultInfo.data;
//////                                            console.dir(resultInfo.data);
//////                                            resultDataList.sort(function(data1,data2){return parseFloat(data1.tid)<parseFloat(data2.tid)?-1:1});
//////                                            console.log(resultDataList.length);
//                                            if (!__production)
//                                                console.log('tid1 : '+resultDataList[resultDataList.length-1].tid);
////
//////
////                                            resultDataList.sort(function(data1,data2){return parseFloat(data1.price)<parseFloat(data2.price)?-1:1});
////
////                                            //                        console.dir(resultDataList[0]);
////                                            //                        console.dir(resultDataList[resultDataList.length-1]);
////
//                                            var lowPrice = parseFloat(resultDataList[0].price);
//                                            var lowDate = resultDataList[0].date;
//                                            var lowTid = resultDataList[0].tid;
////
//                                            var highPrice = parseFloat(resultDataList[resultDataList.length-1].price);
//                                            var highDate = resultDataList[resultDataList.length-1].date;
//                                            var highTid = resultDataList[resultDataList.length-1].tid;
////
////                                            if (!__production)
////                                                console.log('low'+lowPrice+'     '+'high'+highPrice);
////
//                                            lowPriceDataList.push({'price':lowPrice,'coin1':coin1,'coin2':coin2,'date':lowDate,'tid':lowTid});
//                                            highPriceDataList.push({'price':highPrice,'coin1':coin1,'coin2':coin2,'date':highDate,'tid':highTid});
////
//                                            if (!__production)
//                                                console.log('增加 : '+ lowPriceDataList.length);
////
//                                            delete requests[coin1];
//
//                                            if (isEmpty(requests))
//                                            {
////                                                try{
//
//                                                    //                    console.log('完成0 : '+ lowPriceDataList.length);
//                                                    alertPush(lowPriceDataList,highPriceDataList,done);
//
////                                                }finally{
////                                                    //                    lowPriceDataList = [];
////                                                    //                    highPriceDataList = [];
////                                                    console.log('alert reuqest is done.');
////                                                    done();
////                                                }
//
//                                            }
//                                        }
//                                        else
//                                        {
//                                            delete requests[coin1];
//
//                                            if (isEmpty(requests))
//                                            {
////                                                try{
//
//                                                    //                    console.log('完成0 : '+ lowPriceDataList.length);
//                                                    alertPush(lowPriceDataList,highPriceDataList,done);
//
////                                                }finally{
////                                                    //                    lowPriceDataList = [];
////                                                    //                    highPriceDataList = [];
////                                                    console.log('alert reuqest is done.');
////                                                    done();
////                                                }
//                                            }
//                                        }
//                                    }
//                                    catch (error){
////
//                                        console.dir(error);
//
//                                        delete requests[coin1];
//
//                                        if (isEmpty(requests))
//                                        {
////                                            try{
//
//                                                //                    console.log('完成0 : '+ lowPriceDataList.length);
//                                                alertPush(lowPriceDataList,highPriceDataList,done);
//
////                                            }finally{
////                                                //                    lowPriceDataList = [];
////                                                //                    highPriceDataList = [];
////                                                console.log('alert reuqest is done.');
////                                                done();
////                                            }
//                                        }
//                                    }
//                                },
//                                error: function(error){
//                                    delete requests[coin1];
//
//                                    if (isEmpty(requests))
//                                    {
////                                        try{
//
//                                            //                    console.log('完成0 : '+ lowPriceDataList.length);
//                                            alertPush(lowPriceDataList,highPriceDataList,done);
//
////                                        }finally{
////                                            //                    lowPriceDataList = [];
////                                            //                    highPriceDataList = [];
////                                            console.log('alert reuqest is done.');
////                                            done();
////                                        }
//                                    }
//                                }
//                            });
//                        }
//                        else
//                        {
//                            delete requests[coin1];
//
//                            if (isEmpty(requests))
//                            {
////                                try{
//
//                                    //                    console.log('完成0 : '+ lowPriceDataList.length);
//                                    alertPush(lowPriceDataList,highPriceDataList,done);
//
////                                }finally{
////                                    //                    lowPriceDataList = [];
////                                    //                    highPriceDataList = [];
////                                    console.log('alert reuqest is done.');
////                                    done();
////                                }
//                            }
//                        }
//
//                    }
//                    catch(error) {
//
//                        console.dir(error);
//
//                        delete requests[coin1];
//
//                        if (isEmpty(requests))
//                        {
////                            try{
//
//                                //                    console.log('完成0 : '+ lowPriceDataList.length);
//                                alertPush(lowPriceDataList,highPriceDataList,done);
//
////                            }finally{
////                                //                    lowPriceDataList = [];
////                                //                    highPriceDataList = [];
////                                console.log('alert reuqest is done.');
////                                done();
////                            }
//                        }
//                    }
//                }
//
//            },
//            error: function() {
//
//                if(requests[coin1])
//                {
//    //                console.log('失败'+ coin1 + '_' + coin2 +'剩余 ：' + length(requests));
//                    delete requests[coin1];
//
//                    if (isEmpty(requests))
//                    {
//                        try{
//
//                            //                    console.log('完成0 : '+ lowPriceDataList.length);
//                            alertPush(lowPriceDataList,highPriceDataList,done);
//
//                        }finally{
//                            //                    lowPriceDataList = [];
//                            //                    highPriceDataList = [];
//                            console.log('alert reuqest is done.');
//                            done();
//                        }
//                    }
//                }
//
//
//            }
//        });
//    }

    function queryQueue(query,priceData,type,done,prices){

    var coin1 = priceData.coin1;
    var coin2 = priceData.coin2;
    var date = priceData.date;
    var tid = priceData.tid;
    var price = priceData.price;

    if (prices[type+coin1+coin2])
    {
        query.find(
            {
                success:function(results){
                    delete prices[type+coin1+coin2];
                    if (results.length)
                    {
                        var userList = [];
                        for (var i=0;i<results.length;++i)
                        {
                            var userFavicon = results[i];
                            var user = userFavicon.get('user');
                            var userId = AV.Object.createWithoutData("_User", user.id);
                            userList.push(userId);
                        }

                        if (userList.length)
                        {
                            if (!__production)
                                console.log(type + ' : 需要提醒的人数 : '+userList.length);

                            var installationQuery = new AV.Query(Installation);
                            installationQuery.containedIn('user',userList);

                            if (type == 'low')
                            {
                                if (!__production)
                                    console.log('需要提醒的交易 : tid = ' + tid + ' date = ' + date + ' price = ' +price);
                                AV.Push.send({
                                    where: installationQuery,
                                    data: {
                                        alert: coin1+' 低价预警: ' +price+ ' 赶紧抄底！',
                                        sound: "remind.mp4",
                                        coin1:coin1,
                                        coin2:coin2,
                                        isHighPrice:false,
                                        price:price
                                    }
                                });
                            }

                            if (type == 'high')
                            {
                                if (!__production)
                                    console.log('需要提醒的交易 : tid = ' + tid + ' date = ' + date + ' price = ' +price);
                                AV.Push.send({
                                    where: installationQuery,
                                    data: {
                                        alert: coin1+' 高价预警: ' +price+ ' 赶紧抛吧！',
                                        sound: "remind.mp4",
                                        coin1:coin1,
                                        coin2:coin2,
                                        isHighPrice:true,
                                        price:price
                                    }
                                });
                            }

                        }
                    }

                    if (isEmpty(prices))
                    {
                        console.log('alert reuqest is done.');
                        done();
                    }

                },
                error:function(error){
                    delete prices[type+coin1+coin2];

                    if (isEmpty(prices))
                    {
                        console.log('alert reuqest is done.');
                        done();
                    }
                }
            }
        );
    }

}

    function alertPush(lowPriceDataList, highPriceDataList, done){

        if (!__production)
            console.log('完成 1: '+ lowPriceDataList.length);

        if (isArray(lowPriceDataList) && isArray(highPriceDataList))
        {
            if (!__production)
                console.log('完成 2: '+ lowPriceDataList.length);

            var prices = {};
            for (var i=0;i<lowPriceDataList.length;++i)
            {
                var coin1 = lowPriceDataList[i].coin1;
                var coin2 = lowPriceDataList[i].coin2;
                prices['low'+coin1+coin2] ='low'+coin1+coin2;
            }
            for (var i=0;i<highPriceDataList.length;++i)
            {
                var coin1 = highPriceDataList[i].coin1;
                var coin2 = highPriceDataList[i].coin2;
                prices['high'+coin1+coin2] = 'high'+coin1+coin2;
            }

            //最低成交价 <= 预警最低价
            for (var i=0;i<lowPriceDataList.length;++i)
            {
                //最低成交价
                var lowPrice = lowPriceDataList[i].price; //4800
                var coin1 = lowPriceDataList[i].coin1;
                var coin2 = lowPriceDataList[i].coin2;

                var coinQuery = new AV.Query(Coin);
                coinQuery.equalTo('coin1', coin1);
                coinQuery.equalTo('coin2', coin2);

                //预警最低价
                var minQuery = new AV.Query(UserFavicon);  //4890
                minQuery.matchesQuery('coin', coinQuery);
                minQuery.equalTo('isPush', true);
                minQuery.exists('minValue');
                minQuery.greaterThan('minValue', 0);
                minQuery.greaterThanOrEqualTo("minValue", lowPrice);
                minQuery.include('user');
                minQuery.include('coin');

                queryQueue(minQuery,lowPriceDataList[i],'low',done,prices);
            }

            //预警最高价 <=  最高成交价
            for (var i=0;i<highPriceDataList.length;++i)
            {
                //最高成交价
                var highPrice = highPriceDataList[i].price;
                var coin1 = highPriceDataList[i].coin1;
                var coin2 = highPriceDataList[i].coin2;

                var coinQuery = new AV.Query(Coin);
                coinQuery.equalTo('coin1', coin1);
                coinQuery.equalTo('coin2', coin2);

                //预警最高价
                var maxQuery = new AV.Query(UserFavicon);
                maxQuery.matchesQuery('coin', coinQuery);
                maxQuery.equalTo('isPush', true);
                maxQuery.exists('maxValue');
                maxQuery.greaterThan('maxValue', 0);
                maxQuery.lessThanOrEqualTo('maxValue', highPrice);
                maxQuery.include('user');
                maxQuery.include('coin');

                queryQueue(maxQuery,highPriceDataList[i],'high',done,prices);

    //            maxQuery.find({
    //                success: function(results) {
    //
    ////                    console.log('？？？？？？？ : '+results.length);
    //
    ////                    if (isArray(results))
    ////                    {
    ////                        console.log('最高价--需要提醒的人数 : '+results.length);
    //
    //                    if (results.length)
    //                    {
    //                        var userList = [];
    //                        for (var i=0;i<results.length;++i)
    //                        {
    //                            var userFavicon = results[i];
    //                            var user = userFavicon.get('user');
    //                            var userId = AV.Object.createWithoutData("_User", user.id);
    //                            userList.push(userId);
    //                        }
    //
    //                        if (userList.length)
    //                        {
    //                            if (!__production)
    //                                console.log('最高价--需要提醒的人数 : '+userList.length);
    //
    //                            var installationQuery = new AV.Query(Installation);
    //                            installationQuery.containedIn('user',userList);
    //
    //                            var coin = results[0].get('coin');
    //                            var coin1 = coin.get('coin1');
    //                            var coin2 = coin.get('coin2');
    //                            var maxValue = userFavicon.get('maxValue');
    //
    //                            AV.Push.send({
    ////                      channels: [ "Public" ],
    //                                where: installationQuery,
    //                                data: {
    //                                    alert: coin1+"  高于: "+ maxValue +"元  赶紧抛吧！",
    //                                    sound: "remind.mp4",
    //                                    coin1:coin1,
    //                                    coin2:coin2,
    //                                    isHighPrice:true,
    //                                    maxValue:maxValue
    //                                }
    //                            });
    //                        }
    //                    }
    ////                    }
    //                },
    //                error: function(error) {
    //                    // There was an error.
    //                }
    //            });
            }
        }
        else
        {
            console.log('alert reuqest is done.');
            done();
        }
    }
}


if (__production)
{
    //生成guid
    function newGuid()
    {
        var guid = "";
        for (var i = 1; i <= 32; i++){
            var n = Math.floor(Math.random()*16.0).toString(16);
            guid += n;
            if((i==8)||(i==12)||(i==16)||(i==20))
                guid += "-";
        }
        return guid;
    }

    //版本验证       version
    AV.Cloud.define('version', function(request, response) {

         if (verNo == request.params.verNo)
         {
             response.success(true);
         }
         else
         {
             response.success(false);
         }

    });

    //Phone注册
    AV.Cloud.define('register', function(request, response) {

        console.log('注册');

//    register(request,response,10,null,'phone');
        register(request,response,10,null);
    });

    function register(request,response,count,error)
    {
            if (count<=0) response.error(error);

            var username = request.params.guid;

            console.log(username);

            if (!username)
            {
                username = newGuid();
            }

    //    var email = username + "@" + "qq" + ".com";

            if (username)
            {
                //创建用户关系
    //        var userRelation = new UserRelation();
    //        userRelation.save().then(function(userRelation){

                var user = new AV.User();
                user.set("username", username);
                user.set("password", username);

    //        var userFavicon = new UserFavicon();
    //        user.set('userFavicon',userFavicon);
    //        user.set("email", email);
    //        user.set('type', type);

                user.signUp(null, {
                    success: function(user) {
    //                console.log('注册3');
                        var dict = {'guid':user.get('username')};

                        console.dir(dict);

                        response.success(dict);
                    },
                    error: function(user, error) {
    //                console.log('注册5');

                        response.error(error);
                    }
                });
    //        });

            }
    }
}


if (!__production)
{
    AV.Cloud.define("get_sign", function(request, response) {

        var key = request.params.key;
        var secret = request.params.secret;
        var postData = request.params.postData;

        var hash = crypto.createHmac('sha512', secret);
        hash.update(postData);
        var hashed_data = hash.digest();

        AV.Cloud.httpRequest({
            method: 'POST',
//        secureProtocol : 'SSLv2_method',
            url: 'https://app.cloopen.com:8883/2013-03-22/Accounts/aaf98f894032b237014047963bb9009d/SubAccounts?sig='+sig.toUpperCase(),
            headers: {
                'KEY': key,
                'SIGN': hashed_data
            },
            body: bodyxml,
            success:function(httpResponse) {

                parseString(httpResponse.text, function (error, result) {

                    if (result)
                    {
                        cloopen2avos(request, response, user, result);
                    }
                    else
                    {
                        response.error('Request failed with response code ' + error);
                    }
                });

            },
            error:function(httpResponse) {

                console.error('Request failed with response code : ' + httpResponse.text);
                response.error('Request failed with response code : ' + httpResponse.status);
            }
        });

    });
}


//if (!__production && 0){
//
//
//
//    var tradeRequestCount = 0;
//    var marketRequestCount = 0;
//    var depthRequestCount = 0;
//
//    var tradeCount = 0;
//    var marketCount = 0;
//    var depthCount = 0;
//
//    var tradeDataList;
//    var marketDataList;
//    var depthDataList;
//
//    var getIsRunning = function(type,block){
//
//        var query = new AV.Query(RequestController);
//        query.equalTo('type',type);
//        query.first({
//            success: function(object) {
//
//                if (object)
//                {
//                    if (typeof(block) == 'function')
//                    {
//                        var isRunning = object.get('isRunning');
//                        block(isRunning);
//                    }
//                }
//                else
//                {
//                    console.error("Error: isRunning 对象不存在");
//                }
//            },
//            error: function(error) {
//                console.error("Error: " + error.code + " " + error.message);
//            }
//        });
//    }
//
//    var setIsRunning = function(type,run,block){
//
//        var query = new AV.Query(RequestController);
//        query.equalTo('type',type);
//        query.first({
//            success: function(object) {
//
//                if (object)
//                {
//                    object.set('isRunning',run);
//                    if (run) object.increment('runCount');
////                if (run) console.log('set running : true');
////                if (!run) console.log('set running : false');
//
//                    object.save(null, {
//
//                        success: function(object) {
//
//                            var isRunning = object.get('isRunning');
//                            if (isRunning == run)
//                            {
//                                console.log('set running success');
//                                if (typeof(block) == 'function' )
//                                {
//                                    block(isRunning);
//                                }
//                            }
//                            else
//                            {
//                                console.log('set running is failed');
//                                setIsRunning(type,run,block);
//                            }
//
//                        },
//                        error: function(object, error) {
//
//                            console.error('set running is failed with error code: '+ error.code + " error message:" + error.message + " error description:"+ error.description);
//                        }
//                    });
//                }
//                else
//                {
//                    console.error("Error: isRunning 对象不存在");
//                }
//            },
//            error: function(error) {
//                console.error("Error: " + error.code + " " + error.message);
//            }
//        });
//    }
//
//    AV.Cloud.define("reset_running", function(request, response) {
//        setIsRunning('trade',false,null);
//        setIsRunning('market',false,null);
//        setIsRunning('depth',false,null);
//        console.log("reset_running");
//    });
//
////AV.Cloud.setInterval('clean_runCount', 10*60, function(){
////
////    console.log('clean_runCount');
//
////    var query = new AV.Query(RequestController);
////    query.find({
////        success: function(objects) {
////
////            if (objects)
////            {
////                for (var i=0;i<objects.length;i++)
////                {
////                    var obj = objects[i];
////                    obj.set('runCount',0);
////                    obj.save();
////                }
////
////                console.log("clean_runCount 成功");
////            }
////            else
////            {
////                console.log("clean_runCount 失败");
////            }
////        },
////        error: function(error) {
////            console.log("clean_runCount 失败");
////            console.error("Error: " + error.code + " " + error.message);
////        }
////    });
//
////} );
//
//AV.Cloud.setInterval('coin_alert', 5, function()
//{
//    lock.sync('coin_alert', 15000, function()
//    {
//        var requests = {}
//        for (var i=0;i<coin1List.length;i++)
//        {
//            var coin = coin1List[i];
//            requests[coin] = coin;
//            alertRequest(requests, coin, 'cny');
//        }
////        for (var i=0;i<coin1List.length;i++)
////        {
////            var coin = coin1List[i];
////            alertRequest(requests, coin, 'cny');
////        }
//    });
//});
//
//function isEmpty(obj)
//{
//    return Object.keys(obj).length === 0;
//}
//
//function length(obj)
//{
//    return Object.keys(obj).length;
//}
//
//var alertRequest = function(requests, coin1,coin2){
//    var url = 'http://cn.bter.com/api/1/trade/'+coin1+'_'+coin2;
//    AV.Cloud.httpRequest({
//        url: url,
//        success: function(httpResponse) {
//
//            if(!requests[coin1])   return;
//
//            delete requests[coin1];
//
//            console.log('成功'+ coin1 + '_' + coin2 +'剩余 ：' +  length(requests));
//
//            if (isEmpty(requests))
//            {
//                console.log('done in success');
//            }
//        },
//        error: function(httpResponse) {
//            if(!requests[coin1])
//                return;
//            delete requests[coin1];
//
//            console.log('失败'+ coin1 + '_' + coin2 +'剩余 ：' + length(requests));
//
//            if (isEmpty(requests))
//            {
//                console.log('done in error');
//            }
//        }
//    });
//}
//
////var alertRequest = function(coin1,coin2){
////
////    ++alertRequestCount;
////    var url = 'http://cn.bter.com/api/1/trade/'+coin1+'_'+coin2;
////    AV.Cloud.httpRequest({
////        url: url,
//////            secureProtocol : 'SSLv1_method',
////        success: function(httpResponse) {
////
//////            console.log(httpResponse.text);
////            --alertRequestCount;
////
//////            if (!__production)
//////                console.log('成功' + coin1 + '_' + coin2);
//////            if (!__production)
////                console.log('剩余 ：' + alertRequestCount);
////
////            var resultInfo ;
////            try {
////                resultInfo = JSON.parse(httpResponse.text);
////
////                //推送
////                if (resultInfo.result && 0)
////                {
////                    var resultDataList = resultInfo.data;
////                    resultDataList.sort(function(data1,data2){return data1.tid<data2.tid?1:-1});
////
////                    var lastPrice = resultDataList[0].price;
////                    console.log('lastPrice : ' + lastPrice);
////
////                    var coinQuery = new AV.Query(Coin);
////                    coinQuery.equalTo('coin1', coin1);
////                    coinQuery.equalTo('coin2', coin2);
////
////                    var maxQuery = new AV.Query(UserFavicon);
////                    maxQuery.matchesQuery('coin', coinQuery);
////                    maxQuery.equalTo('isPush', true);
////                    maxQuery.exists('maxValue');
////                    maxQuery.notEqualTo('maxValue', 0);
////                    maxQuery.lessThanOrEqualTo('maxValue', lastPrice);
////
////                    var minQuery = new AV.Query(UserFavicon);
////                    minQuery.matchesQuery('coin', coinQuery);
////                    minQuery.equalTo('isPush', true);
////                    minQuery.exists('minValue');
////                    minQuery.notEqualTo('minValue', 0);
////                    minQuery.greaterThanOrEqualTo("minValue", lastPrice);
////
////                    var mainQuery = AV.Query.or(maxQuery, minQuery);
////                    mainQuery.find({
////                        success: function(results) {
////
////                            console.log('2 : '+results.length);
//////                              var userList = new Array();
////                            for (var userFav in results)
////                            {
////                                var user = results.get('user');
////                                var userId = AV.Object.createWithoutData("_User", user.id);
////                                var installationQuery = new AV.Query(Installation);
////                                installationQuery.equalTo('user', userId);
////
////                                AV.Push.send({
//////                                    channels: [ "Public" ],
////                                    where: installationQuery,
////                                    data: {
////                                        alert: "哈哈哈"
////                                    }
////                                });
////                            }
////                            // results contains a list of players that either have won a lot of games or won only a few games.
////                        },
////                        error: function(error) {
////                            // There was an error.
////                        }
////                    });
////                }
////
////            } catch(e) {
////                if (!__production)
////                {
////                    console.log('请求过于频繁');
////                    console.dir(e);
////                    console.dir(httpResponse.text)
////                }
////            }
////
////            if (alertRequestCount == 0)
////            {
////                setIsRunning('alert',false,function(isRunning){
////
////                    if (!isRunning)
////                        console.log('alerty Done ');
////                    else
////                        console.log('alert Not Done !!!!!!!!');
////
////                });
////            }
////        },
////        error: function(httpResponse) {
////
////            --alertRequestCount;
////
//////            if (!__production)
//////                console.log('失败'+ coin1 + '_' + coin2);
//////            if (!__production)
////                console.log('剩余 ：' + alertRequestCount);
////
////            if (alertRequestCount == 0)
////            {
////                setIsRunning('alert',false,function(isRunning){
////
////                    if (!isRunning)
////                        console.log('alerty Done ');
////                    else
////                        console.log('alert Not Done !!!!!!!!');
////
////                });
////            }
////        }
////    });
////}
//
//
//
//
////AV.Cloud.setInterval('coin_request', 5, function(){
//
////    console.log('coin_request');
//    //历史成交记录 API
////    getIsRunning('trade',function(isRunning){
////
////        if (tradeRequestCount == 0 && !isRunning)
////        {
////            tradeDataList = new Array();
////            tradeRequestCount = 0;
////
////            setIsRunning('trade',true);
////
////            console.log('tradeHistroy Start');
////
//////            if (!__production)
//////                console.log('tradeCount : ' + tradeCount++);
////
////
////            for (;tradeRequestCount<coin1List.length;tradeRequestCount++)
////            {
//////            if (!__production)
//////                console.log('创建请求 : '+marketRequestCount);
////                tradeHistory(coin1List[tradeRequestCount],'cny');
////            }
////        }
////        else
////        {
//////        if (!__production)
//////            console.log('还有有请求没有返回---return');
////        }
////    });
//
//    //交易行情 API
////    getIsRunning('market',function(isRunning){
////
////        if (!isRunning)
////        {
////            setIsRunning('market',true,function(isRunning){
////
////                if (isRunning)
////                {
////                    marketDataList = new Array();
//////                    marketRequestCount = 0;
////
////                    console.log('marketHistroy Start');
////
//////            if (!__production)
//////                console.log('marketCount : ' + marketCount++);
////
////                    for (var i=0;i<coin1List.length;i++)
////                    {
//////            if (!__production)
//////                console.log('创建请求 : '+marketRequestCount);
////                        marketHistory(coin1List[i],'cny');
////                    }
////                }
////            });
////        }
////        else
////        {
//////        if (!__production)
//////            console.log('还有有请求没有返回---return');
////        }
////    });
//
//    //市场深度 API
////    getIsRunning('depth',function(isRunning){
////
////        if (!isRunning)
////        {
////            depthDataList = new Array();
////            depthRequestCount = 0;
////
////            setIsRunning('depth',true);
////
////            console.log('depthHistroy Start');
////
//////            if (!__production)
//////                console.log('depthCount : ' + depthCount++);
////
////
////            for (;depthRequestCount<coin1List.length;depthRequestCount++)
////            {
//////            if (!__production)
//////                console.log('创建请求 : '+marketRequestCount);
////                depthHistory(coin1List[depthRequestCount],'cny');
////            }
////        }
////        else
////        {
//////        if (!__production)
//////            console.log('还有有请求没有返回---return');
////        }
////    });
//
////});
//
//    var tradeHistory = function(coin1,coin2){
//
//        var query = new AV.Query(TradeHistory);
//        query.equalTo('coin1',coin1);
//        query.equalTo('coin2',coin2);
//        query.descending('tid');
//        query.first({
//            success: function(object) {
////            console.dir(object);
//                if (object)
//                {
//                    var lastTid = object.get('tid');
////                console.log('lastTid : ' + lastTid);
//                    tradeHistoryRequest(coin1,coin2,lastTid);
//                }
//                else
//                {
//                    tradeHistoryRequest(coin1,coin2,null);
//                }
//            },
//            error: function(error) {
////                console.log(2);
//                if (error.code == 101)//表中还没用数据
//                {
//                    tradeHistoryRequest(coin1,coin2,null);
//                }
//                else
//                {
//                    console.error("Error: " + error.code + " " + error.message);
//                }
//            }
//        });
//    }
//
//    var marketHistory = function(coin1,coin2){
//
//        marketHistoryRequest(coin1,coin2);
//
//    }
//
//    var depthHistory = function(coin1,coin2){
//
//        depthHistoryRequest(coin1,coin2);
//
//    }
//
//    var tradeHistoryRequest = function(coin1,coin2,lastTid){
//
//        if (lastTid && lastTid != 0)
//        {
//            var url = 'http://cn.bter.com/api/1/trade/'+coin1+'_'+coin2+'/'+lastTid;
//        }
//        else
//        {
//            var url = 'http://cn.bter.com/api/1/trade/'+coin1+'_'+coin2;
//        }
//
////    if (!__production)
////         console.log(url);
//
//        AV.Cloud.httpRequest({
//            url: url,
////            secureProtocol : 'SSLv1_method',
//            success: function(httpResponse) {
//
////            console.log(httpResponse.text);
//                --tradeRequestCount;
//
//                var resultInfo ;
//                try {
//                    resultInfo = JSON.parse(httpResponse.text);
//
////                if (!__production)
////                    console.log('成功' + coin1 + '_' + coin2);
////                if (!__production)
////                    console.log('剩余 ：' + marketRequestCount);
//
//                    //保存数据
//                    if (resultInfo.result)
//                    {
//                        var resultDataList = resultInfo.data;
//                        resultDataList.sort(function(data1,data2){return parseInt(data1.tid) <parseInt(data2.tid)?1:-1});
//
//                        var count = resultDataList.length;
//                        if (count > 80)  count=80;
//
//                        for (var i=resultInfo.data.length-1;i>=resultDataList.length-count;i--)
//                        {
//                            var data = resultInfo.data[i];
////                    console.dir(data.price +' ---  '+parseFloat(data.price));
//
//                            var trade = new TradeHistory();
//                            trade.set('date',data.date);
//                            trade.set('price',price = parseFloat(data.price));
//                            trade.set('amount',parseFloat(data.amount));
//                            trade.set('tid',data.tid);
//                            trade.set('type',data.type);
//                            trade.set('coin1',coin1);
//                            trade.set('coin2',coin2);
//                            tradeDataList.push(trade);
//                        }
//
////                    console.log('tradeDataList长度 : '+tradeDataList.length);
//                    }
//
//                    //推送
//                    if (resultInfo.result && 0)
//                    {
//                        var resultDataList = resultInfo.data;
//                        resultDataList.sort(function(data1,data2){return data1.tid<data2.tid?1:-1});
//
//                        var lastPrice = resultDataList[0].price;
//                        console.log('lastPrice : ' + lastPrice);
//
//                        var coinQuery = new AV.Query(Coin);
//                        coinQuery.equalTo('coin1', coin1);
//                        coinQuery.equalTo('coin2', coin2);
//
//                        var maxQuery = new AV.Query(UserFavicon);
//                        maxQuery.matchesQuery('coin', coinQuery);
//                        maxQuery.equalTo('isPush', true);
//                        maxQuery.exists('maxValue');
//                        maxQuery.notEqualTo('maxValue', 0);
//                        maxQuery.lessThanOrEqualTo('maxValue', lastPrice);
//
//                        var minQuery = new AV.Query(UserFavicon);
//                        minQuery.matchesQuery('coin', coinQuery);
//                        minQuery.equalTo('isPush', true);
//                        minQuery.exists('minValue');
//                        minQuery.notEqualTo('minValue', 0);
//                        minQuery.greaterThanOrEqualTo("minValue", lastPrice);
//
//                        var mainQuery = AV.Query.or(maxQuery, minQuery);
//                        mainQuery.find({
//                            success: function(results) {
//
//                                console.log('2 : '+results.length);
////                              var userList = new Array();
//                                for (var userFav in results)
//                                {
//                                    var user = results.get('user');
//                                    var userId = AV.Object.createWithoutData("_User", user.id);
//                                    var installationQuery = new AV.Query(Installation);
//                                    installationQuery.equalTo('user', userId);
//
//                                    AV.Push.send({
////                                    channels: [ "Public" ],
//                                        where: installationQuery,
//                                        data: {
//                                            alert: "哈哈哈"
//                                        }
//                                    });
//                                }
//                                // results contains a list of players that either have won a lot of games or won only a few games.
//                            },
//                            error: function(error) {
//                                // There was an error.
//                            }
//                        });
//                    }
//
//                } catch(e) {
//                    if (!__production)
//                    {
//                        console.log('请求过于频繁');
//                        console.dir(e);
//                        console.dir(httpResponse.text)
//                    }
//                }
//
//                if (tradeRequestCount == 0)
//                {
//                    saveAllTrade();
//                }
//            },
//            error: function(httpResponse) {
//
//                --tradeRequestCount;
//
////            if (!__production)
////                console.log('失败'+ coin1 + '_' + coin2);
////            if (!__production)
////                console.log('剩余 ：' + tradeRequestCount);
//
//                if (tradeRequestCount == 0)
//                {
//                    saveAllTrade();
//                }
//            }
//        });
//    }
//
//    var marketHistoryRequest = function(coin1,coin2){
//
//        var url = 'http://cn.bter.com/api/1/ticker/'+coin1+'_'+coin2;
//
////    if (!__production)
////        console.log(url);
//        ++marketRequestCount;
//
//        AV.Cloud.httpRequest({
//            url: url,
////            secureProtocol : 'SSLv1_method',
//            success: function(httpResponse) {
//
////            console.log(httpResponse.text);
//                --marketRequestCount;
//
//                if (marketRequestCount>=0)
//                {
//
//                    var resultInfo ;
//                    try {
//                        resultInfo = JSON.parse(httpResponse.text);
//
//                        if (!__production)
//                            console.log('成功' + coin1 + '_' + coin2);
//                        if (!__production)
//                            console.log('剩余 ：' + marketRequestCount);
//
//                        //保存数据
//                        if (resultInfo.result)
//                        {
//                            var market = new MarketHistory();
//                            market.set('last',parseFloat(resultInfo.last));
//                            market.set('high',parseFloat(resultInfo.high));
//                            market.set('low',parseFloat(resultInfo.low));
//                            market.set('avg',parseFloat(resultInfo.avg));
//                            market.set('sell',parseFloat(resultInfo.sell));
//                            market.set('buy',parseFloat(resultInfo.buy));
//                            market.set('avg',parseFloat(resultInfo.avg));
//                            market.set('vol1',parseFloat(resultInfo['vol_'+coin1]));
//                            market.set('vol2',parseFloat(resultInfo['vol_'+coin2]));
//                            market.set('coin1',coin1);
//                            market.set('coin2',coin2);
//                            marketDataList.push(market);
//                        }
//
//                    } catch(e) {
//
//                        if (!__production)
//                            console.log('失败'+ coin1 + '_' + coin2);
//                        if (!__production)
//                            console.log('剩余 ：' + marketRequestCount);
//
//                        if (!__production)
//                        {
//                            console.log('请求过于频繁');
//                            console.dir(e);
//                            console.dir(httpResponse.text)
//                        }
//                    }
//                }
//
//                if (marketRequestCount <= 0)
//                {
//                    saveAllMarket();
//                }
//
//            },
//            error: function(httpResponse) {
//
//                --marketRequestCount;
//
//                if (!__production)
//                    console.log('失败'+ coin1 + '_' + coin2);
//                if (!__production)
//                    console.log('剩余 ：' + marketRequestCount);
//
//                if (marketRequestCount <= 0)
//                {
//                    saveAllMarket();
//                }
//            }
//        });
//    }
//
//    var depthHistoryRequest = function(coin1,coin2){
//
//        var url = 'http://cn.bter.com/api/1/depth/'+coin1+'_'+coin2;
//
////    if (!__production)
////        console.log(url);
//
//        AV.Cloud.httpRequest({
//            url: url,
////            secureProtocol : 'SSLv1_method',
//            success: function(httpResponse) {
//
////            console.log(httpResponse.text);
//                --depthRequestCount;
//
//                var resultInfo ;
//
//                try {
//                    resultInfo = JSON.parse(httpResponse.text);
//
////                if (!__production)
////                    console.log('成功' + coin1 + '_' + coin2);
////                if (!__production)
////                    console.log('剩余 ：' + depthRequestCount);
//
//                    //保存数据
//                    if (resultInfo.result)
//                    {
//                        var depthAskComissionList = new Array();
//                        var depthAskPriceList = new Array();
//                        var depthBidComissionList = new Array();
//                        var depthBidPriceList = new Array();
//
//                        for (var i=0;i<resultInfo.asks.length;i++)
//                        {
//                            var ask = resultInfo.asks[i];
//                            depthAskComissionList.push(parseFloat(ask[0]));
//                            depthAskPriceList.push(parseFloat(ask[1]));
//                        }
//                        for (var i=0;i<resultInfo.bids.length;i++)
//                        {
//                            var bid = resultInfo.bids[i];
//                            depthBidComissionList.push(parseFloat(bid[0]));
//                            depthBidPriceList.push(parseFloat(bid[1]));
//                        }
//                        var depth = new DepthHistory();
//                        depth.set('askCommission',depthAskComissionList);
//                        depth.set('askPrice',depthAskPriceList);
//                        depth.set('bidCommission',depthBidComissionList);
//                        depth.set('bidPrice',depthBidPriceList);
//                        depth.set('coin1',coin1);
//                        depth.set('coin2',coin2);
//                        depthDataList.push(depth);
//                    }
//
//                } catch(e) {
//                    if (!__production)
//                    {
//                        console.log('请求过于频繁');
//                        console.dir(e);
//                        console.dir(httpResponse.text)
//                    }
//
//                }
//
//                if (depthRequestCount == 0)
//                {
//                    saveAllDepth();
//                }
//
//            },
//            error: function(httpResponse) {
//
//                --depthRequestCount;
//
////            if (!__production)
////                console.log('失败'+ coin1 + '_' + coin2);
////            if (!__production)
////                console.log('剩余 ：' + depthRequestCount);
//
//                if (depthRequestCount == 0)
//                {
//                    saveAllDepth();
//                }
//            }
//        });
//    }
//
//
////判断是否是数组的函数
//    var isArray = function (obj) {
//        //return obj && !(obj.propertyIsEnumerable('length')) && typeof obj === 'object' && typeof obj.length === 'number';
//        if (obj instanceof Array)
//        {
//            console.log('是数组');
//            if (obj.length)
//            {
////            console.log('长度不为0');
//                return true;
//            }
//            else
//            {
////            console.log('长度为0');
//                return false;
//            }
//        }
//        else
//        {
////        console.log('不是数组');
//            return false;
//        }
//    };
//
//    var saveAllTrade = function(){
//
//        if (!__production)
//            console.log('tradeHistroy' + ' : ' + 'save数组 ： ' + tradeDataList.length);
//
//        AV.Object.saveAll(tradeDataList,function(completeList,error){
//
//            if (completeList)
//            {
//                console.log('tradeHistroy' + ' : ' + tradeDataList.length+' object is created ');
//            }
//            else
//            {
//                console.error('tradeHistroy' + ' : ' + tradeDataList.length+' is failed to create with error code: '+ error.code + " error message:" + error.message + " error description:"+ error.description);
//            }
//
//            tradeDataList.splice(0);
////        tradeIsSaveDone = 1;
//
//            setIsRunning('trade',false);
//
//            console.log('tradeHistroy Done ');
//
//        });
//    }
//
//    var saveAllMarket = function(){
//
//        if (!__production)
//            console.log('marketHistroy' + ' : ' + 'save数组 ： ' + marketDataList.length);
//
//        if (isArray(marketDataList))
//        {
//            var dataList = marketDataList.slice(0);
//            marketDataList.splice(0);
//
//            AV.Object.saveAll(dataList,function(completeList,error){
//
//                if (completeList)
//                {
//                    console.log('marketHistroy' + ' : ' + completeList.length+' object is created ');
//                }
//                else
//                {
//                    console.error('marketHistroy' + ' : ' + dataList.length+' is failed to create with error code: '+ error.code + " error message:" + error.message + " error description:"+ error.description);
//                }
//
//
////        marketIsSaveDone = 1;
//                setIsRunning('market',false,function(isRunning){
//
//                    if (!isRunning)
//                        console.log('marketHistroy Done ');
//                    else
//                        console.log('marketHistroy Not Done !!!!!!!!');
//
//                });
//
//            });
//        }
//        else
//        {
//            setIsRunning('market',false,function(isRunning){
//
//                if (!isRunning)
//                    console.log('marketHistroy Done ');
//                else
//                    console.log('marketHistroy Not Done !!!!!!!!');
//
//            });
//        }
//    }
//
//    var saveAllDepth = function(){
//
//        if (!__production)
//            console.log('depthHistroy' + ' : ' + 'save数组 ： ' + depthDataList.length);
//
//        AV.Object.saveAll(depthDataList,function(completeList,error){
//
//            if (completeList)
//            {
//                console.log('depthHistroy' + ' : ' + depthDataList.length+' object is created ');
//            }
//            else
//            {
//                console.error('depthHistroy' + ' : ' + depthDataList.length+' is failed to create with error code: '+ error.code + " error message:" + error.message + " error description:"+ error.description);
//            }
//
//            depthDataList.splice(0);
////        tradeIsSaveDone = 1;
//
//            setIsRunning('depth',false);
//
//            console.log('depthHistroy Done ');
//
//        });
//    }
////var saveAllObject = function(list,className){
////
////    if (!__production)
////        console.log(className + ' : ' + 'save数组 ： ' + list.length);
////
////    AV.Object.saveAll(list,function(completeList,error){
////
////        if (completeList)
////        {
////            console.log(className + ' : ' + list.length+' object is created ');
////        }
////        else
////        {
////            console.error(className + ' : ' + list.length+' is failed to create with error code: '+ error.code + " error message:" + error.message + " error description:"+ error.description);
////        }
////
////        list.splice(0);
////
////        if (className == 'marketHistroy')
////        {
////            console.log('marketHistroy Done');
////            marketIsSaveDone = 1;
////        }
////        else if (className == 'tradeHistroy')
////        {
////            console.log('tradeHistroy Done');
////            tradeIsSaveDone = 1;
////        }
////        else
////        {
////            console.log('xxxxx');
////        }
////    });
////}
//
//
////market
//    var refreashMarket = function(coin1,coin2){
//
////    console.log(coin1+'_'+coin2);
//
//        AV.Cloud.httpRequest({
//            url: 'http://cn.bter.com/api/1/ticker/'+coin1+'_'+coin2,
////            secureProtocol : 'SSLv1_method',
//            success: function(httpResponse) {
//
//                console.log(++i);
//
//                console.dir(JSON.parse(httpResponse.text));
//                var resultInfo = JSON.parse(httpResponse.text);
//
////            var lastPrice = resultInfo.last;
////
////            var maxQuery = new AV.Query(UserFavicon);
////            maxQuery.equalTo('coin.coin1', coin1);
////            maxQuery.equalTo('coin.coin2', coin2);
////            maxQuery.doesNotExist('maxValue');
////            maxQuery.notEqualTo('maxValue', 0);
////            maxQuery.greaterThanOrEqualTo('maxValue', lastPrice);
////
////            var minQuery = new AV.Query(UserFavicon);
////            minQuery.equalTo('coin.coin1', coin1);
////            minQuery.equalTo('coin.coin2', coin2);
////            minQuery.doesNotExist('minValue');
////            minQuery.notEqualTo('minValue', 0);
////            minQuery.lessThanOrEqualTo("minValue", lastPrice);
////
////            var mainQuery = AV.Query.or(maxQuery, minQuery);
////            mainQuery.find({
////                success: function(results) {
////
//////                    var userList = new Array();
////                    for (var userFav in results)
////                    {
////                        var user = results.get('user');
////                        var installationQuery = new AV.Query(Installation);
////                        installationQuery.equalTo('user', user);
////
////                        AV.Push.send({
////                            channels: [ "Public" ],
////                            where: installationQuery,
////                            data: {
////                                alert: "Public message"
////                            }
////                        });
////                    }
////
////                    // results contains a list of players that either have won a lot of games or won only a few games.
////                },
////                error: function(error) {
////                    // There was an error.
////                }
////            });
//
////            if (resultInfo.result)
////            {
////                var Market = AV.Object.extend(coin1+'_'+coin2);
////                var market = new Market();
////                market.set('last',resultInfo.last);
////                market.set('high',resultInfo.high);
////                market.set('low',resultInfo.low);
////                market.set('avg',resultInfo.avg);
////                market.set('sell',resultInfo.sell);
////                market.set('buy',resultInfo.buy);
////                market.set('vol1',resultInfo.vol1);
////                market.set('vol2',resultInfo.vol2);
////                market.set('coin1',coin1);
////                market.set('coin2',coin2);
////                market.save(null, {
////                    success: function(market) {
////                        // Execute any logic that should take place after the object is saved.
////                        console.log('New object created with objectId: ' + market.id);
////                    },
////                    error: function(market, error) {
////                        // Execute any logic that should take place if the save fails.
////                        // error is a AV.Error with an error code and description.
////                        console.error('Failed to create new object, with error code: '+ error.code + " error message:" + error.message + " error description:"+ error.description);
////                    }
////                });
////            }
//            },
//            error: function(httpResponse) {
//                console.log('失败');
////            console.error(httpResponse.text);
//            }
//        });
//    }
//
//    AV.Cloud.define("push", function(request, response) {
//
//        var installationQuery = new AV.Query(Installation);
////    installationQuery.equalTo('user', request.params.user);
//        AV.Push.send({
////        channels: [ "Public" ],
////        where: installationQuery,
//            data: {
//                alert: "hehehe"
//            }
//        });
//
//    });
//
//
//
//    AV.Cloud.define("test", function(request, response) {
//
////    var count = ++count1;
////
////    if (count >= coin1List.length)
////    {
////        count1 = 0;
////        count = count1;
////    }
//
//        tradeHistoryRequest('btc','cny',null);//1
//        tradeHistoryRequest('ltc','cny',null);//2
//        tradeHistoryRequest('ftc','cny',null);//3
//        tradeHistoryRequest('frc','cny',null);//4
//        tradeHistoryRequest('ppc','cny',null);//5
////    tradeHistoryRequest('trc','cny',null);//6
//        tradeHistoryRequest('wdc','cny',null);//7
//        tradeHistoryRequest('yac','cny',null);//8
//        tradeHistoryRequest('cnc','cny',null);//9
//        tradeHistoryRequest('bqc','cny',null);//10
//        tradeHistoryRequest('ifc','cny',null);//11
//        tradeHistoryRequest('zcc','cny',null);//12
//        tradeHistoryRequest('cmc','cny',null);//13
//        tradeHistoryRequest('xpm','cny',null);//14
//        tradeHistoryRequest('pts','cny',null);//15
//        tradeHistoryRequest('tag','cny',null);//16
//        tradeHistoryRequest('tix','cny',null);//17
//        tradeHistoryRequest('src','cny',null);//18
//        tradeHistoryRequest('mec','cny',null);//19
//        tradeHistoryRequest('nmc','cny',null);//20
//        tradeHistoryRequest('qrk','cny',null);//21
//        tradeHistoryRequest('btb','cny',null);//22
//        tradeHistoryRequest('exc','cny',null);//23
//        tradeHistoryRequest('dtc','cny',null);//24
////    tradeHistoryRequest('bsc','cny',null);//26
//        tradeHistoryRequest('cent','cny',null);//25
//
//    });
//
//
//
//    AV.Cloud.define("get_coin", function(request, response) {
//
//    });
//
//
//}

