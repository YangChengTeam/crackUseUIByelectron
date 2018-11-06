// npm i co request
const ipc = require("electron").ipcRenderer;
const co = require("co");
const fs = require("fs");
const request = require("request");
const rp = require("request-promise");

function closeMenu(){
   $(".menu").hide();
}
// 获取所有视频json
function getAllVideoInfo(force = false){
  closeMenu();
  co(function*(){
    let dir = "data";
    if(!fs.existsSync(dir)){  
        fs.mkdirSync(dir);
    }
    for(let j = 0 ; j < infos.length ; j++){
      let page = 1 
      let pageCount = 0
      let list = []
      for(;true;){  
        if((pageCount !=0 && page > pageCount) || pageCount == undefined) {
          break;
        }
        let path = dir + "/" + infos[j].name+"-"+page+".json";
        if(!force && fs.existsSync(path)){
           page++;
             continue;
        }
        [list, pageCount] = yield getVideoList(infos[j].type, page, infos[j].timestamp, infos[j].userkey);
        if(!list || list.length == 0) continue;
        for(let i = 0; i < list.length; i++){
            if(infos[j].type == 4){
              let info = yield getVideoUrl(list[i].vid, list[i].uidx);
              list[i].videoURL = info["videoURL"];    
            }     
        }
        fs.writeFileSync(path, JSON.stringify(list));
        page++;
        }
      }
  });
}

// 下载视频
function downloadVideos(){

  let dir = "data";
  if(!fs.existsSync(dir)){  
         alert("请先导出数据");
         return;
  }
   closeMenu();
  co(function*(){
    let files = fs.readdirSync(dir);
    for(let j = 0; j < files.length ; j++){
      if(files[j].indexOf("json") == -1){ continue; }
      var contents = fs.readFileSync(dir+ "/" + files[j], 'utf8');
      var list = JSON.parse(contents);
      for(let i = 0; i < list.length; i++){
        if(list[i]){
          yield downloadVideo(list[i].videoURL);
        }
      }
    }
  });
}


function getVideoUrl(vid, touseridx){
  var options = {
  url: `https://catchatapi.mliao.com.cn/zh-cn/video/videoinfo?usertoken=8748aefb26cf7eabc16f37e202f083b9&vid=${vid}&touseridx=${touseridx}&useridx=${touseridx}`,
  headers: {
      "devicetype": "android",
    "channelid":  "ML003",
    "maoliao":  "1",
    "packageid":  "com.thai.vtalk",
    "appversion": "1.2.0",
    "lang": "0",
    "timestamp":  "1536887556979",
    "userkey":  "d58cb1da39433e064033c9852ef0e956",
    "Host": "catchatapi.mliao.com.cn",
    "User-Agent": "okhttp/3.10.0"
    }
  };
  
  let promise = new Promise((r, j)=>{
    request(options, (error, response, body)=>{
      let json = JSON.parse(body);
      if(!error && json && json.data){
          r(json.data);
      } else {
          j(error);
      }
    });
  });

  return promise;
} 


function getVideoList(type, page, timestamp, userkey){ 
  var options = {
  url: `https://catchatapi.mliao.com.cn/zh-cn/video/homevideo?usertoken=8748aefb26cf7eabc16f37e202f083b9&tagtype=${type}&page=${page}&useridx=60103771`,
  headers: {
    "devicetype": "android",
    "channelid":  "ML003",
    "maoliao":  "1",
    "packageid":  "com.thai.vtalk",
    "appversion": "1.2.0",
    "lang": "0",
    "timestamp":  timestamp,
    "userkey":  userkey,
    "Host": "catchatapi.mliao.com.cn",
    "User-Agent": "okhttp/3.10.0"
    }
  };

  let promise = new Promise((r, j)=>{
    request(options, (error, response, body)=>{
      try{
        let json = JSON.parse(body);
        let list = json.data.videoList;
        if(error && !list){
           j(error);
        } else {
           r([list, json.data.pageCount]);
        }
      }catch(e){
        j(response);
      }
    });
  });
  return promise;
}

function downloadVideo(url, dir = "videos"){
  let promise = new Promise((r, j) =>{
    if(!url) { j(); return; }
    let urls = url.split("/")
    if(!fs.existsSync(dir)){  
        fs.mkdirSync(dir);
    }
    let path = dir + "/" + urls[urls.length - 1]
    if(fs.existsSync(path)){  
        r();
        return;
    }
    console.log(path)
    try {
      var stream = request(url).pipe(fs.createWriteStream(path))
      stream.on('finish', function () {
        r();
      });
    }catch(e){
      j();
    }
  });
  return promise;
}

function getAnchorInfo(idx){
    var options = {
      url: `https://catchatapi.mliao.com.cn/zh-cn/Anchor/getAnchorInfo?anchoridx=${idx}&useridx=${idx}`,
      headers: {
        "devicetype": "android",
        "channelid":  "ML003",
        "maoliao":  "1",
        "packageid":  "com.thai.vtalk",
        "appversion": "1.2.0",
        "lang": "0",
        "timestamp":  "1536887889666",
        "userkey":  "6d7b0c17c6ff920f29439b63f2225d21",
        "Host": "catchatapi.mliao.com.cn",
        "User-Agent": "okhttp/3.10.0"
        },
        json: true
      };
      return rp(options);
}

function getMyVideo(idx){
    var options = {
      url: `https://catchatapi.mliao.com.cn/zh-cn/video/myvideo?usertoken=20a8c444ad1ac2034f2c7a39bc72d07f&page=1&touseridx=${idx}&useridx=${idx}`,
      headers: {
        "devicetype": "android",
        "channelid":  "ML003",
        "maoliao":  "1",
        "packageid":  "com.thai.vtalk",
        "appversion": "1.2.0",
        "lang": "0",
        "timestamp":  "1538013807627",
        "userkey":  "bd3f45abf811f08a9b9f07b578507a3d",
        "Host": "catchatapi.mliao.com.cn",
        "User-Agent": "okhttp/3.10.0"
        },
        json: true
      };
    return rp(options);
}

const infos  = [
{ name: "主播", type: 0, timestamp: "1536887889666", userkey:"6d7b0c17c6ff920f29439b63f2225d21", page: 1, loading: true },{
  name: "推荐", type: 2, timestamp: "1536887889666", userkey:"6d7b0c17c6ff920f29439b63f2225d21", page: 1, loading: true
},{
  name:"最新", type:1, timestamp:"1536901465460", userkey:"baece5552d8f021d5d9f49aca8a9a48c", page: 1, loading: true
},{
  name:"付费", type:4, timestamp:"1536887889666", userkey:"6d7b0c17c6ff920f29439b63f2225d21", page: 1, loading: true
},{
  name:"热门", type:5, timestamp:"1536901796879", userkey:"7052e7241e6aafaa2780c545e7caac41", page: 1, loading: true
}]


function gentabs(){
    let html = "";
    infos.forEach((v, i)=>{
        html += `<li class="tab-item ${i==0 ? 'tab-item-current' : ''}" id="tab-${v.type}">${v.name}</li>`;     
    });
    $("#tabs").html(html);
}

function genswiper(){
    let html = "";
    infos.forEach((v, i)=>{
        html += `<div class="swiper-slide"><div class="list"></div></div>`;
    });
    $(".swiper-wrapper").html(html);
}


let type = 1
let page = 1
function gen2(){
    $(".loading").css("display", "flex");
    $(".loading img").attr("src", "loading.gif");
    if(type >= 4){
        $(".swiper-slide ").eq(0).find(".list").find(".next").remove();
        let html = `<div class="next">已全部加载完成</div>`;
        $(".swiper-slide ").eq(0).find(".list").append($(html));
        $(".loading").hide();
        return;
    }
    co(function*(){
        let data = yield getHomeList(page, type++);
        $(".loading").hide();
        let list = data.data.list;
        if(!list || list.length == 0) {
            return;
        }
        let html = "<div style='height: 80px; width: 100%;'></div>";
        list.forEach((item, i)=>{
              if(item.AlbumList.length > 0){
                  html += `<div class="item2"><img onclick="gen3('${item.useridx}', '${item.myname}')" src="${item.AlbumList[0].imgUrl}"><div onclick="gen3('${item.useridx}')" class="name">${item.myname} <br/> <div onclick="gen3(${item.useridx})">ID:${item.useridx}</div></div><div onclick="downloadAnchorInfo('${item.useridx}', this)" class="download">下载</div></div>`;
              }
        });
        
        $(".swiper-slide ").eq(0).find(".list").find(".next").remove();
         html += `<div class="next" onclick="gen2()">点击加载下一页</div>`
        $(".swiper-slide ").eq(0).find(".list").append($(html));
    });
}

function gen3(idx, myname){
    $(".loading").css("display", "flex");
    $(".loading img").attr("src", "loading.gif");
    $(".mylist").show();
    $(".mylist2").html("");
    $(".myname").html(myname);

    co(function*(){
        let data = yield getMyVideo(idx);
        $(".loading").hide();
        let list = data.data.videoList;
        if(!list || list.length == 0) {
            $(".mylist2").append(`<div style="width: 100%;text-align:center; color:#000; font-size: 16px;">没有上传视频</div>`);
            return;
        }

        let html = "";

        list.forEach((item, i)=>{
              html += `<div class="item"><img onclick="detail('${item.videoURL}')" src="${item.videoCoverURL}"><div onclick="detail('${item.videoURL}')" class="name">${item.descriptions}</div><div onclick="download('${item.videoURL}', this)" class="download">下载</div></div>`;
        });
        
        $(".mylist2").append($(html));
    });
}

function downloadAnchorInfo(idx, obj){
    co(function*(){
        let item = yield getAnchorInfo(idx);
        if(item && item.data){
           let dir = "covers"
           if(!fs.existsSync(dir)){  
              fs.mkdirSync(dir);
           }
           dir = dir + "/" + idx;
           if(!fs.existsSync(dir)){  
              fs.mkdirSync(dir);
           }
           item.data.anchorAlbumList.forEach(v=>{
                downloadVideo(v.imgUrl, dir)
           });
        }
        let item2 = yield getMyVideo(idx)
        if(item2 && item2.data){
           let dir = "videos"
           if(!fs.existsSync(dir)){  
              fs.mkdirSync(dir);
           }
           dir = dir + "/" + idx;
           if(!fs.existsSync(dir)){  
              fs.mkdirSync(dir);
           }
           item2.data.videoList.forEach(v=>{
                downloadVideo(v.videoURL, dir)
           });
        }
         $(obj).html("下载完成");
    });
}

function getHomeList(pges, type = 0){
    type = 95 + type;
    var options = {
      url: `https://catchatapi.mliao.com.cn/zh-cn/Home/getHomeList?pageSize=300&pges=${pges}&pages=${pges}&type=${type}&useridx=60103771`,
      headers: {
        "devicetype": "android",
        "channelid":  "ML003",
        "maoliao":  "1",
        "packageid":  "com.thai.vtalk",
        "appversion": "1.2.0",
        "lang": "0",
        "timestamp":  "1536887889666",
        "userkey":  "6d7b0c17c6ff920f29439b63f2225d21",
        "Host": "catchatapi.mliao.com.cn",
        "User-Agent": "okhttp/3.10.0"
        },
        json: true
      };
      return rp(options);
}


function searchShow(){
    $(".search").show();
    $(".search2").show(); 
}

function searchHide(){
   $(".search").hide();
    $(".search2").hide(); 
}

function gen(i){

    co(function*(){
        let info = infos[i];
        if(info.page == 1 && i == 0){
           $(".loading").show().css("display", "flex");
           $(".loading img").attr("src", "loading.gif");
        }
        let [list, pageCount] = yield getVideoList(info.type, info.page, info.timestamp, info.userkey);
        $(".loading").hide();
        if(info.type == 4){
          for(let i = 0; i < list.length; i++){
                let info = yield getVideoUrl(list[i].vid, list[i].uidx);
                list[i].videoURL = info["videoURL"];         
          }
        } 
        if(!list || list.length == 0) {
           return;
        } 
        let html = "<div style='height: 80px; width: 100%;'></div>";
        list.forEach((item, i)=>{
              html += `<div class="item"><img onclick="detail('${item.videoURL}')" src="${item.videoCoverURL}"><div onclick="detail('${item.videoURL}')" class="name">${item.descriptions} <br/><div onclick="gen3(${item.uidx})">ID:${item.uidx}</div></div><div onclick="download('${item.videoURL}', this)" class="download">下载</div></div>`;
        });
        info.pageCount = pageCount;
        infos[i].loading = false;
        $(".swiper-slide ").eq(i).find(".list").find(".next").remove();
        console.log(info)
        if(info.pageCount && info.page < info.pageCount) {
            html += `<div class="next" onclick="next(this)">点击加载下一页</div>`
        }
        $(".swiper-slide ").eq(i).find(".list").append($(html));
    })
}


function search(){
  let idx = $(".search2").val();
  co(function*(){
        var item = yield getAnchorInfo(idx);
        if(item && item.data){
             $(".swiper-slide").eq(0).find(".list").html("");
             item  = item.data;
             console.log(item)
             var html = "<div style='height: 0px; width: 100%;'></div>";
             html += `<div class="item2"><img onclick="gen3('${item.anchorInfo.useridx}', '${item.anchorInfo.myName}')" src="${item.anchorAlbumList[0].imgUrl}"><div onclick="gen3('${item.anchorInfo.useridx}')" class="name">${item.anchorInfo.myName}</div><div onclick="downloadAnchorInfo('${item.anchorInfo.useridx}', this)" class="download">下载</div></div>`;
             $(".swiper-slide").eq(0).find(".list").append($(html));
        }
  });
}

function download(url, obj){
    let dir = "videos";
    if(!fs.existsSync(dir)){  
        fs.mkdirSync(dir);
    }
    let urls = url.split("/");
    let path = urls[urls.length - 1]
    let stream = request(url).pipe(fs.createWriteStream(dir + "/" + path));
    $(obj).html("下载中...");
    stream.on('finish', function () {
        $(obj).html("下载完成");
      });
}

function detail(url){
   $(".loading").find("img").attr("src", "loading2.gif");
   $(".loading").show().css("display", "flex");
   $(".video").show();
   $(".video-wrapper").html(`<video onloadeddata="loadeddata()" src="${url}" controls="controls" autoplay></video>`);
}

function loadeddata(){
   $(".loading").css("display", "none");
}

function closeVideo(){
   $(".video").css("display", "none");
   $(".loading").css("display", "none");
}

function closeMyVideo(){
   $(".mylist").css("display", "none");
   $(".loading").css("display", "none");
}

var swiper;

function next(obj){
  let info = infos[swiper.activeIndex];
  if(!info.loading){
     info.page++;
     info.loading = true;
     gen(swiper.activeIndex);
     $(obj).html("加载中...");
  }          
}

function init(){
   gen(1);
   gen(2);
   gen(3);
   gen(4);
   gen2();
}

function more(){
   $(".menu").css("display", "flex");
}



$(function(){
       $("#tabs li").click(function(){
             let i = $(this).index();
             $("#tabs li").removeClass("tab-item-current").eq(i).addClass("tab-item-current");
             swiper.slideTo(i);
      });
});
gentabs();
genswiper();
swiper = new Swiper('.swiper-container');
swiper.on('slideChange', function () {
       $("#tabs li").removeClass("tab-item-current").eq(swiper.activeIndex).addClass("tab-item-current")
       if(swiper.activeIndex == 0){
          searchShow();
       } else {
          searchHide();
       }
});
init();
function refresh(){
   closeMenu();
   type = 0;
   $(".list").html("");
   init();
}







