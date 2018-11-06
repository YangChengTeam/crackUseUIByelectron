const co = require('co');
const rp = require('request-promise');
const request = require('request');
const fs = require("fs");

process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";

var base_from = {
    platform: '',
    version: 5002008,
    channel: 'oppo',
    deviceId: 'f836403e71c846eda3ba884857714eb9',
    diven: 'd92d307f29494d90834fa8ebd5bba84a',
    model: 'HUAWEI_HUAWEI MLA-AL10',
    os: '4.4.2'
}

var search_from = {
    limit : 50,
    grade: '',
    page: 1,
    zone: '',
    subject: '',
    name: ''
}

var detail_form = {
  search_id: '-1',
  platform: 0,
  bid: 0
}

var base_options = {
  method : 'POST',
  headers : {
    Cookie: 'PHPSESSID=60fe93c7f6cc78b64e648f028780458e095a5af1'
  },
  json: true
}

function search(){
  search_from.name = $(".search1 input").val();

  if(!search_from.name){
     alert("书名不能为空");
     return
  }

  $(".loading").show().css("display", "flex");
  
  var search_options = {
      url: 'https://106.75.74.218/workbook/search/searchByName',
      form: Object.assign(base_from, search_from)
  }

  rp(Object.assign(base_options, search_options)).then((data)=>{
       $(".loading").hide();
       if(data && data.list && data.list.length > 0){
          let html = "";
          data.list.forEach((item, i)=>{
              html += `<div class="item"><img src="${item.book.cover}"><div class="name">${item.book.name}</div><div onclick="detail(${i}, '${search_from.name}', ${item.book.id},'${item.book.cover}')" class="download">下载</div></div>`;
          });
          $(".list").html(html);
       } else {
          $(".list").html("没有搜索到内容");
       }
       
  });
}

function download(name , id, url, i){
  let promise = new Promise((r, j) =>{
    if(!url) { j(); return; }
    let path = name + "/" + id + "/" + `${i+1}.png`;
    if(fs.existsSync(path)){  
        r();
        return;
    }
    console.log(path)
    try {
      var stream = request(url).pipe(fs.createWriteStream(path));
      stream.on('finish', function () {
        r();
      });
    }catch(e){
      j();
    }
  });
  return promise;
}

function detail(idx, name, id, cover){
  detail_form.bid = id;
  var detail_options = {
      url: 'https://106.75.74.218/workbook/book/getDetail',
      form: Object.assign(base_from, detail_form)
  }

  if(!fs.existsSync(name)){  
    fs.mkdirSync(name);
  }

  if(!fs.existsSync(name + "/" + id)){  
    fs.mkdirSync(name + "/" + id);
  }

  request(cover).pipe(fs.createWriteStream(name + "/" + id + "/" + 'cover.png'));

  rp(Object.assign(base_options, detail_options)).then((data)=>{
        if(data && data.detail){
           co(function*(){
               for(let i = 0 ; i < data.detail.length ; i++){
                     yield download(name, id, data.detail[i].image, i);
                     $(".download").eq(idx).html(`下载中${i+1}/${data.detail.length}`);
               }
               $(".download").eq(idx).html("已完成").css("color", "#dc143c");
           });  
        }
  });
}


base_options2 = {
     method: "POST",
     headers: {
        "token": 'ecf096e2-6469-453a-aefd-c5cf8c218d06',
        "Authorization": '',
        "mobileCode":  '864394010174870',
        "from": "android",
        "X-BlueWare-ID": "UF0DDCogNR9WaxQxBF0m",
        "equipment": "HUAWEI MLA-AL10",
        "X-Requested-With": "XMLHttpRequest",
        "X-BlueWare-Transaction-Orgion": "3faa5328f2aa58f0410edad3b45d2831"
     },
     json: true
}
 

function search2(){
    let name = $(".search2 input").val();
    let grade = $(".search2 select").val();
    
    if(!name){
       alert("书名不能为空");
       return
    }

    let body = {
      "grade": grade,
      "name": name,
      "pageNum": 1,
      "pageSize": 50
    }
    var detail_options = {
        url: 'https://checkanswer.helpedu.com/homework/searchHomeworkByName',
        body: body
    }

    $(".loading").show().css("display", "flex");

    rp(Object.assign(base_options2, detail_options)).then((data)=>{
        $(".loading").hide();
        if(data && data.data && data.data.length > 0){

            let html = "";
            data.data.forEach((item, i)=>{
                html += `<div class="item"><img src="${item.coverImageUrl}"><div class="name">${item.name}</div><div onclick="detail2(${i}, '${name}', ${grade}, ${item.id},'${item.coverImageUrl}')" class="download">下载</div></div>`;
            });
            $(".list").html(html);
        } else {
            $(".list").html("没有搜索到内容");
        }
    });
}

function detail2(idx, name, grade, id, cover){
  let body = {
      "grade": grade,
      "homeworkId": id,
      "homeworkType": null,
      "masterNo": null,
      "pageSize": 0,
      "subject": name
  }

  if(!fs.existsSync(name)){  
    fs.mkdirSync(name);
  }

  if(!fs.existsSync(name + "/" + id)){  
    fs.mkdirSync(name + "/" + id);
  }

  request(cover).pipe(fs.createWriteStream(name + "/" + id + "/" + 'cover.png'));


  var detail_options = {
        url: 'https://checkanswer.helpedu.com/newHomework/getNewAnwserImageUrl',
        body: body
  }

  rp(Object.assign(base_options2, detail_options)).then((data)=>{
       if(data && data.data){
           co(function*(){
               for(let i = 0 ; i < data.data.length ; i++){
                     yield download(name, id, data.data[i], i);
                     $(".download").eq(idx).html(`下载中${i+1}/${data.data.length}`);
               }
               $(".download").eq(idx).html("已完成").css("color", "#dc143c");
           });  
        }
  });
}

var wid = 0;
$(function(){
  $(document).keyup(function(event){

      if(event.keyCode == 13){
          if(wid == 1){
             search();
          } else if(wid == 2) {
             search2();
          }
      }
  });
})


function select(id){
   wid = id;
   $("#back").show();
   $(".menu").hide();
   $("#content" + wid).show();
}

function back(){
   wid = 0;
   $(".menu").show();
   $("#content" + 1).hide();
   $("#content" + 2).hide();
   $("#back").hide();
   $(".list").html("")
}

