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


function getVideoUrl(vid){
  var options = {
    url: `http://sp42.vliao12.com/v32/smallvideo/get-one`,
    method: "POST",
    form: {
       userId:  "2154731", 
       userKey: "7ed3284a53598c8a20e04b7776ba59f6",
       videoId: vid
   },
   headers: {
      "InterfaceVersion": "4.2",
      "AppTime":  "Mon Nov 05 15:50:11 GMT+08:00 2018",
      "InterfaceSystemVersion":  "4.4.2",
      "AppName":  "vchar",
      "InterfaceChannel": "yyb",
      "InterfaceVersionCode": "44"
    },
   json: true
  };
  return rp(options);
}


function getVideoList(tagId, page){ 
  var options = {
  
  url: `http://sp42.vliao12.com/v31/homepage`,
  method: "POST",
  form: {
     userId:  "2154731", 
     userKey: "7ed3284a53598c8a20e04b7776ba59f6",
     tagId: tagId,
     page: page
  },
  headers: {
    "InterfaceVersion": "4.2",
    "AppTime":  "Mon Nov 05 15:50:11 GMT+08:00 2018",
    "InterfaceSystemVersion":  "4.4.2",
    "AppName":  "vchar",
    "InterfaceChannel": "yyb",
    "InterfaceVersionCode": "44"
    }
  };

  let promise = new Promise((r, j)=>{
    request(options, (error, response, body)=>{
      try{
        let json = JSON.parse(body);
        r(json);
      }catch(e){
        j(response);
      }
    });
  });
  return promise;
}

function download2(url, dir = "videos", suff){
  let promise = new Promise((r, j) =>{
    if(!url) { j(); return; }
    let urls = url.split("/")
    if(!fs.existsSync(dir)){  
        fs.mkdirSync(dir);
    }
    let path = dir + "/" + urls[urls.length - 1] + suff
    if(fs.existsSync(path)){  
        r();
        return;
    }
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
    url: `http://sp42.vliao12.com/v31/bigv/detail-base`,
    method: "POST",
    form: {
       userId:  "2154731", 
       userKey: "7ed3284a53598c8a20e04b7776ba59f6",
       vid: idx
   },
   headers: {
      "InterfaceVersion": "4.2",
      "AppTime":  "Mon Nov 05 15:50:11 GMT+08:00 2018",
      "InterfaceSystemVersion":  "4.4.2",
      "AppName":  "vchar",
      "InterfaceChannel": "yyb",
      "InterfaceVersionCode": "44"
    },
   json: true
  };
      return rp(options);
}

function getMyVideo(idx){
    var options = {
      method: "POST",
      url: `http://sp42.vliao12.com/v32/smallvideo/bigv-list`,
      form: {
      userId:  "2154731", 
      userKey: "7ed3284a53598c8a20e04b7776ba59f6",
      vid: idx,
      page: 1
  },
  headers: {
    "InterfaceVersion": "4.2",
    "AppTime":  "Mon Nov 05 15:50:11 GMT+08:00 2018",
    "InterfaceSystemVersion":  "4.4.2",
    "AppName":  "vchar",
    "InterfaceChannel": "yyb",
    "InterfaceVersionCode": "44"
    },
        json: true
      };

    return rp(options);
}



var infos  = [
{ name: "推荐", tagId: 99998, page: 1, loading: true },{
  name: "新人", tagId: 99997,  page: 1, loading: true
},{
  name:"三星", tagId:3, page: 1, loading: true
},{
  name:"四星", tagId:4,  page: 1, loading: true
},{
  name:"五星", tagId:5, page: 1, loading: true
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


function gen3(idx, myname){
    $(".loading").css("display", "flex");
    $(".loading img").attr("src", "loading.gif");
    $(".mylist").show();
    $(".mylist2").html("");
    $(".myname").html(myname);

    co(function*(){
        let data = yield getMyVideo(idx).catch(e=>{alert(e)});
        $(".loading").hide();
        let list = data.data;
        if(!list || list.length == 0) {
            $(".mylist2").append(`<div style="width: 100%;text-align:center; color:#000; font-size: 16px;">没有上传视频</div>`);
            return;
        }

        let html = "";

       for(let i=0; i<list.length;i++){
               let tmp = yield getVideoUrl(list[i].id);
               list[i].videoURL = tmp["data"].url;
           };

        list.forEach((item, i)=>{
              html += `<div class="item"><img onclick="detail('${item.videoURL}')" src="${item.cover.url}"><div onclick="detail('${item.videoURL}')" class="name">${item.title}</div><div onclick="download('${item.videoURL}', this)" class="download">下载</div></div>`;
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

           item.data.photos.forEach(v=>{
                download2(v.url, dir, suff = ".jpg")
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

           let list = item2.data;
            for(let i=0; i<list.length;i++){
               let tmp = yield getVideoUrl(list[i].id);
               list[i].videoURL = tmp["data"].url;
           };

           list.forEach(v=>{
                download2(v.videoURL, dir,  suff = ".mp4")
           });
        }
         $(obj).html("下载完成");
    });
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
        let json = yield getVideoList(info.tagId, info.page);
        [list, pageCount] = [json.data, json.maxPage];
        $(".loading").hide();
        
        if(!list || list.length == 0) {
           return;
        } 
        let html = "<div style='height: 80px; width: 100%;'></div>";
        list.forEach((item, i)=>{
              html += `<div class="item2"><img onclick="gen3(${item.id}, '${item.nickname}')" src="${item.avatar.url}"><div onclick="gen3(${item.id}, '${item.nickname}')" class="name">${item.nickname} <br/><div onclick="gen3(${item.id}, '${item.nickname}')">ID:${item.id}</div></div><div onclick="downloadAnchorInfo('${item.id}', this)" class="download">下载</div></div>`;
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
function searchUser(keyword) {
var options = {
      method: "POST",
      url: `  http://sp42.vliao12.com/user/search`,
      form: {
      userId:  "2154731", 
      userKey: "7ed3284a53598c8a20e04b7776ba59f6",
      keyword: keyword
  },
  headers: {
    "InterfaceVersion": "4.2",
    "AppTime":  "Mon Nov 05 15:50:11 GMT+08:00 2018",
    "InterfaceSystemVersion":  "4.4.2",
    "AppName":  "vchar",
    "InterfaceChannel": "yyb",
    "InterfaceVersionCode": "44"
    },
        json: true
      };

    return rp(options);

}


function search(){
  let keyword = $(".search2").val();
  co(function*(){
        var item = yield searchUser(keyword);
        if(item && item.data){
             $(".swiper-slide").eq(0).find(".list").html("");
             let list  = item.data;
             console.log(item)
             var html = "<div style='height: 0px; width: 100%;'></div>";

            list.forEach((item, i)=>{
               html += `<div class="item2"><img onclick="gen3('${item.id}', '${item.realName}')" src="${item.avatar.url}"><div onclick="gen3(${item.id}, '${item.realName}')" class="name">${item.realName}</div><div onclick="downloadAnchorInfo('${item.id}', this)" class="download">下载</div></div>`;
            });


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
    let stream = request(url).pipe(fs.createWriteStream(dir + "/" + path+ ".mp4"));
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
   gen(0);
   gen(1);
   gen(2);
   gen(3);
   gen(4);
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
    infos  = [
{ name: "推荐", tagId: 99998, page: 1, loading: true },{
  name: "新人", tagId: 99997,  page: 1, loading: true
},{
  name:"三星", tagId:3, page: 1, loading: true
},{
  name:"四星", tagId:4,  page: 1, loading: true
},{
  name:"五星", tagId:5, page: 1, loading: true
}]
   closeMenu();
   type = 0;
   $(".list").html("");
   init();
}







