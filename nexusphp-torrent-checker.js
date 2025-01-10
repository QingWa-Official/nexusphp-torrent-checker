// ==UserScript==
// @name         nexusphp-torrent-checker
// @namespace    http://tampermonkey.net/
// @version      0.0.1
// @description  新版NP架构种审检查
// @author       QingWaPT-Official
// @thanks       PTerClub Torrent Checker
// @match        *://*.qingwapt.com/details.php*
// @match        *://*.qingwa.pro/details.php*
// @icon         https://qingwapt.com/favicon.ico
// @grant        none
// @license      MIT
// @downloadURL  https://update.greasyfork.org/scripts/522994/nexusphp-torrent-checker.user.js
// @updateURL    https://update.greasyfork.org/scripts/522994/nexusphp-torrent-checker.meta.js
// ==/UserScript==

(function () {
  'use strict';

  //页面提醒元素
  const h1 = document.getElementById('top');
  let correctTitle;

  const checkResultBox = document.createElement('div');
  checkResultBox.id = 'CheckBox';
  checkResultBox.style =
    'max-height: 1080px; max-width: 300px; opacity: 1; overflow: auto; display: block; position: fixed; left: 1%; bottom: 70%; opacity: 1; z-index: 90; background-color: white';

  //Info 初始化
  const TORRENT_INFO = {
    titleInfo: {
      origin: '',
      logo: '',
      name: '',
      season: '',
      chapter1: '-1',
      chapter2: '',
      year: '',
      resolution: '',
      source: '',
      remux: false,
      vcodec: '',
      bitdepth: '',
      fps: '',
      hdr: '',
      dv: false,
      acodec: '',
      channels: '',
      aobject: '',
      group: '',
      freeinfo: '',
    },
    tableInfo: {
      torrentFilename: '',
      subtitle: '',
      chapter1: '-1',
      chapter2: '',
      size: '',
      category: '',
      zhiliang: '',
      area: '',
      files: 1,
      imdburl: '',
      doubanurl: '',
      tags: '',
      hasTagMandarin: false,
      hasTagCantonese: false,
      hasTagChineseSubtitles: false,
      hasTagEnglishSubtitles: false,
      hasTagDIY: false,
    },
    descInfo: {
      moviename: '',
      imdburl: '',
      doubanurl: '',
      area: '',
      lang: '',
      chapters: '',
      category: '',
      publishdate: '',
    },
    mediaInfo: {
      full: '',
      filesize: '',
      video: {
        format: '',
        bitrates: '',
        hdr: '',
        dv: false,
        fps: '',
        width: '',
        height: '',
        bitdepth: '',
        scantype: '',
        codec: '',
      },
      audios: {},
      audio_lang: 0,
      subtitles: {},
      hasMandarin: false,
      hasCantonese: false,
      hasChineseSubtitles: false,
      hasEnglishSubtitles: false,
      standard: '',
    },
    bdInfo: {
      full: '',
      DIY: false,
      video: {
        format: '',
        bitrates: '1 kbps',
        hdr: '',
        dv: false,
        resolution: '',
      },
      video_dv: '0 kbps',
      audios: {},
      subtitles: [],
    },
    results: {
      title: '',
      season: '',
      chapter1: '-1',
      chapter2: '',
      files: 1,
      resolution: '',
      source: '',
      remux: false,
      vcodec: '',
      hdr: '',
      dv: false,
      acodec: '',
      channels: '',
      aobject: '',
      group: '',
      dupe: false,
      subtitle: '',
      category: '',
      zhiliang: '',
      standard: '',
    },
  };

  let match;

  //获取：tableInfo（帖子内容的表格）
  let table = document.querySelectorAll(' td#outer > table ')[0];
  for (let i = 0; i < table.rows.length; i++) {
    const rows = table.rows[i];
    const cells = rows.cells;
    const textContent = cells[0].textContent.trim();
    switch (textContent) {
      case '下载': {
        //获取种子文件名
        let torrentFilename = table.rows[i].cells[1].firstChild.textContent;
        TORRENT_INFO.tableInfo.torrentFilename = torrentFilename.match(
          /(?<=\[PTer\]\.).*?(?=\.torrent)/
        )[0];
        break;
      }
      case '副标题': {
        //获取副标题
        TORRENT_INFO.tableInfo.subtitle = table.rows[i].cells[1].textContent;
        if (
          TORRENT_INFO.tableInfo.subtitle.match(
            /((全|共)\s?[0-9]{1,4}\s?(集|话|期)|[0-9]{1,4}\s?(集|话|期)全)/
          )
        ) {
          TORRENT_INFO.tableInfo.chapter1 = '';
          TORRENT_INFO.tableInfo.chapter2 = TORRENT_INFO.tableInfo.subtitle
            .match(/((全|共)\s?[0-9]{1,4}\s?(集|话|期)|[0-9]{1,4}\s?(集|话|期)全)/)[0]
            .replace(/(全|共|集|话|期)/g, '')
            .trim();
        } else if (
          TORRENT_INFO.tableInfo.subtitle.match(/第?\s?[0-9]{1,4}-[0-9]{1,4}\s?(集|话|期)/)
        ) {
          let chapterArr = TORRENT_INFO.tableInfo.subtitle
            .match(/第?\s?[0-9]{1,4}-[0-9]{1,4}\s?(集|话|期)/)[0]
            .replace(/(第|集|话|期)/g, '')
            .split('-');
          TORRENT_INFO.tableInfo.chapter1 = chapterArr[0].trim();
          TORRENT_INFO.tableInfo.chapter2 = chapterArr[1].trim();
        } else if (TORRENT_INFO.tableInfo.subtitle.match(/第?\s?[0-9]{1,4}\s?(集|话|期)/)) {
          TORRENT_INFO.tableInfo.chapter2 = TORRENT_INFO.tableInfo.subtitle
            .match(/第?\s?[0-9]{1,4}\s?(集|话|期)/)[0]
            .replace(/(第|集|话|期)/g, '')
            .trim();
        }
        break;
      }
      case '类别与标签': {
        //获取标签
        if (TORRENT_INFO.tableInfo.tags == '') {
          TORRENT_INFO.tableInfo.tags = table.rows[i].cells[1].textContent.trim();
          if (TORRENT_INFO.tableInfo.tags.match(/国语/)) {
            TORRENT_INFO.tableInfo.hasTagMandarin = true;
          }
          if (TORRENT_INFO.tableInfo.tags.match(/粤语/)) {
            TORRENT_INFO.tableInfo.hasTagCantonese = true;
          }
          if (TORRENT_INFO.tableInfo.tags.match(/中字/)) {
            TORRENT_INFO.tableInfo.hasTagChineseSubtitles = true;
          }
          if (TORRENT_INFO.tableInfo.tags.match(/英字/)) {
            TORRENT_INFO.tableInfo.hasTagEnglishSubtitles = true;
          }
          if (TORRENT_INFO.tableInfo.tags.match(/DIY原盘/)) {
            TORRENT_INFO.tableInfo.hasTagDIY = true;
          }
        }
        break;
      }
      case '基本信息': {
        //获取基本信息
        let info = table.rows[i].cells[1].textContent;
        if (info.match(/地区.*/)) {
          TORRENT_INFO.tableInfo.area = info.match(/地区.*/)[0].trim();
          info = info.replace(TORRENT_INFO.tableInfo.area, '');
        }
        if (info.match(/质量.*/)) {
          TORRENT_INFO.tableInfo.zhiliang = info
            .match(/质量.*/)[0]
            .replace('Remux', 'REMUX')
            .trim();
          info = info.replace(TORRENT_INFO.tableInfo.zhiliang, '');
          TORRENT_INFO.tableInfo.zhiliang = TORRENT_INFO.tableInfo.zhiliang.replace('质量: ', '');
        }
        if (info.match(/类型.*/)) {
          TORRENT_INFO.tableInfo.category = info.match(/类型.*/)[0].trim();
          info = info.replace(TORRENT_INFO.tableInfo.category, '');
        }
        if (info.match(/大小.*/)) {
          TORRENT_INFO.tableInfo.size = info
            .match(/大小.*/)[0]
            .replace('大小：', '')
            .trim();
        }
        break;
      }
      case 'IMDb链接': {
        //获取 IMDb 链接
        TORRENT_INFO.tableInfo.imdburl = table.rows[i].cells[1].textContent.trim();
        break;
      }
      case '豆瓣链接': {
        //获取豆瓣链接
        TORRENT_INFO.tableInfo.doubanurl = table.rows[i].cells[1].textContent.trim();
        break;
      }
      case '简介': {
        //获取：descInfo（帖子正文）
        let descr = table.rows[i].cells[1].firstChild.textContent;
        let descr_rows = descr.split('\n');
        descr_rows.forEach((r) => {
          let match;
          if (r.match(/.*(片.*名|名.*字).*/)) {
            //'　'
            match = r.match(/.*(片.*名|名.*字)/);
            TORRENT_INFO.descInfo.moviename =
              TORRENT_INFO.descInfo.moviename + '/' + r.replace(match[0], '').trim();
          } else if (r.match(/.*(译.*名|又.*名|别.*名).*/)) {
            match = r.match(/.*(译.*名|又.*名|别.*名)/);
            TORRENT_INFO.descInfo.moviename =
              TORRENT_INFO.descInfo.moviename + '/' + r.replace(match[0], '').trim();
          } else if (r.match(/(http|https):\/\/www\.imdb\.com\/title\/tt[0-9]{0,8}/)) {
            TORRENT_INFO.descInfo.imdburl =
              'http://' + r.match(/www\.imdb\.com\/title\/tt[0-9]{0,8}/)[0].trim();
          } else if (r.match(/douban\.com\/subject\/[0-9]{0,8}/)) {
            TORRENT_INFO.descInfo.doubanurl =
              'https://movie.' + r.match(/douban\.com\/subject\/[0-9]{0,8}/)[0].trim();
          } else if (
            r.match(/(制\s*片|产\s*地|国\s*家|地\s*区)/) &&
            !r.match(/(制\s*片\s*人|压.*制.*片.*源)/) &&
            TORRENT_INFO.descInfo.area == '' &&
            TORRENT_INFO.descInfo.area == ''
          ) {
            match = r.match(/.*(制\s*片|产\s*地|国\s*家|地\s*区)/);
            TORRENT_INFO.descInfo.area = r
              .replace(match[0], '')
              .replace('中国香港', '香港')
              .replace('中国台湾', '台湾')
              .trim();
          } else if (r.match(/.*语.*言.*/) && TORRENT_INFO.descInfo.lang == '') {
            match = r.match(/.*语.*言/);
            TORRENT_INFO.descInfo.lang = r.replace(match[0], '').trim();
          } else if (r.match(/.*集.*数.*/) && TORRENT_INFO.descInfo.chapters == '') {
            match = r.match(/.*集.*数/);
            TORRENT_INFO.descInfo.chapters = r.replace(match[0], '').trim();
            console.log(TORRENT_INFO.descInfo.chapters);
            if (!TORRENT_INFO.descInfo.chapters.match(/^[0-9]{1,4}$/)) {
              TORRENT_INFO.descInfo.chapters = '';
            }
          } else if (
            r.match(/.*(类.*型|类.*别).*/) &&
            (TORRENT_INFO.descInfo.category == '' || TORRENT_INFO.descInfo.category == '电影') &&
            !r.match(/我们的TG/)
          ) {
            match = r.match(/.*(类.*型|类.*别)/);
            TORRENT_INFO.descInfo.category = r.replace(match[0], '').trim();
            if (TORRENT_INFO.descInfo.category.match(/纪录片/)) {
              TORRENT_INFO.descInfo.category = '纪录片';
            } else if (TORRENT_INFO.descInfo.category.match(/动画/)) {
              TORRENT_INFO.descInfo.category = '动画';
            } else if (TORRENT_INFO.descInfo.category.match(/真人秀/)) {
              TORRENT_INFO.descInfo.category = '综艺';
            } else if (TORRENT_INFO.descInfo.category.match(/(4K|HDR)/i)) {
              TORRENT_INFO.descInfo.category = '';
            }
          } else if (
            r.match(/(首\s*映|上映日期|年\s*代|年\s*份)/) &&
            TORRENT_INFO.descInfo.publishdate == ''
          ) {
            match = r.match(/(首\s*映|上映日期|年\s*代|年\s*份)/);
            TORRENT_INFO.descInfo.publishdate = r.replace(match[0], '').trim();
            if (TORRENT_INFO.descInfo.publishdate.match(/[1-2][0-9]{3}/)) {
              TORRENT_INFO.descInfo.publishdate =
                TORRENT_INFO.descInfo.publishdate.match(/[1-2][0-9]{3}/)[0];
              console.log(`年份为 ${TORRENT_INFO.descInfo.publishdate}`);
            } else {
              TORRENT_INFO.descInfo.publishdate = '';
            }
          }
        });
        break;
      }
      default:
        break;
    }
  }
  //获取 mediaInfo
  let codeHides = document.getElementsByClassName('hide');
  let quote = document.getElementsByTagName('fieldset');
  let mediaInfo = '';
  let bdInfo = '';
  let infoSp;
  if (codeHides) {
    for (let i = 0; i < codeHides.length; i++) {
      if (codeHides[i].textContent.match(/General\s*(ID|Complete\sname|File\sname|Unique\sID)/i)) {
        mediaInfo = codeHides[i].textContent;
        if (
          codeHides[i].getElementsByTagName('img').length != 0 ||
          mediaInfo.match(/\[img\][\S\s]*?\[\/img\]/i)
        ) {
          checkResultBox.innerHTML += '<span style="color: red">Info 中含有图片</span><br>';
        }
        break;
      } else if (
        bdInfo == '' &&
        codeHides[i].textContent
          .trim()
          .match(/^(Disc\sTitle|Disc\sLabel|DISC\sINFO|QUICK SUMMARY):/i)
      ) {
        bdInfo = codeHides[i].textContent;
        if (
          codeHides[i].getElementsByTagName('img').length != 0 ||
          bdInfo.match(/\[img\][\S\s]*?\[\/img\]/i)
        ) {
          checkResultBox.innerHTML += '<span style="color: red">Info 中含有图片</span><br>';
        }
      }
    }
  }
  if (quote && !mediaInfo && !bdInfo) {
    console.log('quote');
    for (let i = 0; i < quote.length; i++) {
      let quotet = quote[i].textContent.replace('引用', '').trim();
      if (quotet.match(/General\s*(ID|Complete\sname|File\sname|Unique\sID)/i)) {
        mediaInfo = quotet.replace(/This release.*\n/i, '');
        if (
          quote[i].getElementsByTagName('img').length != 0 ||
          mediaInfo.match(/\[img\][\S\s]*?\[\/img\]/i)
        ) {
          checkResultBox.innerHTML += '<span style="color: red">Info 中含有图片</span><br>';
        }
        break;
      } else if (quotet.match(/^(Disc\sTitle|Disc\sLabel|DISC\sINFO|QUICK SUMMARY):/i)) {
        if (bdInfo == '') {
          bdInfo = quotet;
          if (
            quote[i].getElementsByTagName('img').length != 0 ||
            bdInfo.match(/\[img\][\S\s]*?\[\/img\]/i)
          ) {
            checkResultBox.innerHTML += '<span style="color: red">Info 中含有图片</span><br>';
          }
        }
      }
    }
  }
  if (mediaInfo) {
    TORRENT_INFO.mediaInfo.full = mediaInfo.replace(/\u2002/g, ' ');
    mediaInfo = TORRENT_INFO.mediaInfo.full
      .replace('Audio Video Interleave', '')
      .replace(/[\s\S]*?General/i, '')
      .replace(/(?<=Video) \#[1-9]\n/gi, '\n')
      .replace(/(?<=Audio) \#[1-9]\n/gi, '\n')
      .replace(/(?<=Text) \#[1-9]\n/gi, '\n');
    mediaInfo = mediaInfo.replace(/(Menu|菜单).*\n00:00:00\.000[\S\s]*$/i, '');
    let stream;
    //General
    match = mediaInfo.match(
      /[\s\S]*?(?=((Video|视频).*\nID|(Audio|音频).*\nID|(Text|文本).*\nID|$))/gi
    )[0];
    if (match.match(/(File size|文件大小).*(?=\n)/i)) {
      TORRENT_INFO.mediaInfo.filesize = match.match(/(File size|文件大小).*(?=\n)/i)[0];
    }
    mediaInfo = mediaInfo.replace(match, '');
    //Video
    match = mediaInfo.match(
      /(Video|视频)[\s\S]*?(?=(\n(Video|视频).*\nID|\n(Audio|音频).*\nID|\n(Text|文本).*\nID|$))/gi
    );
    if (match) {
      stream = match[0];
      mediaInfo = mediaInfo.replace(stream, '');
      if (stream.match(/(Format|格式).*/i)) {
        mediaInfo = mediaInfo.replace(stream, '');
      } else {
        stream = match[1];
        mediaInfo = mediaInfo.replace(stream, '');
      }
      if (stream.match(/(Format|格式).*/i)) {
        TORRENT_INFO.mediaInfo.video.format = stream.match(/(Format|格式).*/i)[0];
        if (
          TORRENT_INFO.mediaInfo.video.format.match(/MPEG/) &&
          stream.match(/Format version.*Version 2/)
        ) {
          TORRENT_INFO.mediaInfo.video.format = 'MPEG-2';
        }
      }
      if (stream.match(/HDR (format|格式).*/i)) {
        let hdr_format = stream.match(/HDR (format|格式).*/i)[0];
        if (hdr_format.match(/Dolby Vision/i)) {
          TORRENT_INFO.mediaInfo.video.dv = true;
          TORRENT_INFO.results.dv = true;
        }
        if (hdr_format.match(/HDR10\+/i)) {
          TORRENT_INFO.mediaInfo.video.hdr = 'HDR10+';
          TORRENT_INFO.results.hdr = 'HDR10+';
        } else if (hdr_format.match(/HDR\sVivid/i)) {
          TORRENT_INFO.mediaInfo.video.hdr = 'HDR Vivid';
          TORRENT_INFO.results.hdr = 'HDR Vivid';
        } else if (hdr_format.match(/HDR10/i)) {
          TORRENT_INFO.mediaInfo.video.hdr = 'HDR10';
          TORRENT_INFO.results.hdr = 'HDR10';
        }
      } else if (
        stream.match(/(Transfer characteristics|Transfer_characteristics_Original).*PQ.*/i)
      ) {
        TORRENT_INFO.mediaInfo.video.hdr = 'HDR10';
        TORRENT_INFO.results.hdr = 'HDR10';
      } else if (
        stream.match(/(Transfer characteristics|Transfer_characteristics_Original).*HLG.*/i)
      ) {
        TORRENT_INFO.mediaInfo.video.hdr = 'HLG';
        TORRENT_INFO.results.hdr = 'HLG';
      }
      if (stream.match(/(Bit rate).*/i)) {
        TORRENT_INFO.mediaInfo.video.bitrates = stream.match(/(Bit rate).*/i)[0].replace(/\s/g, '');
        if (TORRENT_INFO.mediaInfo.video.bitrates.match(/Mb/i)) {
          TORRENT_INFO.mediaInfo.video.bitrates =
            parseFloat(
              TORRENT_INFO.mediaInfo.video.bitrates.replace(/Bitrate:/i, '').replace(/Mb\/s/i, '')
            ) * 1024;
        } else if (TORRENT_INFO.mediaInfo.video.bitrates.match(/kb/i)) {
          TORRENT_INFO.mediaInfo.video.bitrates = parseInt(
            TORRENT_INFO.mediaInfo.video.bitrates.replace(/Bitrate:/i, '').replace(/kb\/s/i, '')
          );
        }
      }
      if (stream.match(/Frame rate.*FPS\n/i)) {
        if (stream.match(/Frame rate.*23.976.*FPS\n/i)) {
          TORRENT_INFO.mediaInfo.video.fps = '24FPS';
        } else if (stream.match(/Frame rate.*24.975.*FPS\n/i)) {
          TORRENT_INFO.mediaInfo.video.fps = '25FPS';
        } else if (stream.match(/Frame rate.*29.970.*FPS\n/i)) {
          TORRENT_INFO.mediaInfo.video.fps = '30FPS';
        } else if (stream.match(/Frame rate.*59.*FPS\n/i)) {
          TORRENT_INFO.mediaInfo.video.fps = '60FPS';
        } else if (stream.match(/Frame rate.*119.*FPS\n/i)) {
          TORRENT_INFO.mediaInfo.video.fps = '120FPS';
        } else {
          TORRENT_INFO.mediaInfo.video.fps = stream
            .match(/Frame rate.*FPS(?=\n)/i)[0]
            .replace(/\s/g, '')
            .replace(/\.000/g, '')
            .match(/[0-9]{2,3}FPS/i)[0];
        }
      }
      if (stream.match(/(Width|宽度).*/i)) {
        TORRENT_INFO.mediaInfo.video.width = parseInt(
          stream
            .match(/(Width|宽度).*/i)[0]
            .replace(/\s/g, '')
            .match(/[0-9]{3,4}(?=(pixels|像素))/i)[0]
        );
      }
      if (stream.match(/(Height|高度).*/i)) {
        TORRENT_INFO.mediaInfo.video.height = parseInt(
          stream
            .match(/(Height|高度).*/i)[0]
            .replace(/\s/g, '')
            .match(/[0-9]{3,4}(?=(pixels|像素))/i)[0]
        );
      }
      if (stream.match(/(Bit depth|位深).*10 (bits|位)\s*\n/i)) {
        TORRENT_INFO.mediaInfo.video.bitdepth = '10';
      } else if (stream.match(/(Bit depth|位深).*8 (bits|位)\s*\n/i)) {
        TORRENT_INFO.mediaInfo.video.bitdepth = '8';
      }
      if (stream.match(/(Scan type|扫描类型|扫描方式).*/i)) {
        TORRENT_INFO.mediaInfo.video.scantype = stream.match(
          /(?<=(Scan type|扫描类型|扫描方式)[\s]*: ).*/i
        )[0];
      }
      if (stream.match(/(Writing library|编码函数库).*/i)) {
        TORRENT_INFO.mediaInfo.video.codec = stream.match(/(Writing library|编码函数库).*/i)[0];
        if (TORRENT_INFO.mediaInfo.video.codec.match(/x264/)) {
          TORRENT_INFO.mediaInfo.video.codec = 'x264';
        } else if (TORRENT_INFO.mediaInfo.video.codec.match(/x265/)) {
          TORRENT_INFO.mediaInfo.video.codec = 'x265';
        } else if (TORRENT_INFO.mediaInfo.video.codec.match(/XviD/)) {
          TORRENT_INFO.mediaInfo.video.codec = 'XviD';
        } else {
          console.log(TORRENT_INFO.mediaInfo.video.codec);
        }
      }
      if (stream.match(/Standard.*NTSC/i)) {
        TORRENT_INFO.mediaInfo.standard = 'NTSC';
      } else if (stream.match(/Standard.*PAL/i)) {
        TORRENT_INFO.mediaInfo.standard = 'PAL';
      }
    }
    console.log(mediaInfo);
    //Audios
    match = mediaInfo.match(
      /\n(Audio|音频).*\n[\s\S]*?(?=(\n(Audio|音频).*\nID|\n(Text|文本).*\nID|$))/gi
    );
    for (let i = 1; match; i++) {
      stream = match[0].trim();
      console.log(stream);
      mediaInfo = mediaInfo.replace(stream, '');
      let audioTitle = 0;
      let audioLang = 0;
      let audioAdd = 0;
      let audio_x = {
        format: '',
        channels: '',
        object: '',
        title: '',
        lang: '',
      };
      if (stream.match(/(Format|格式).*/)) {
        audio_x.format = stream.match(/(Format|格式).*/)[0];
        if (audio_x.format.match(/MLP FBA 16-ch/)) {
          audio_x.format = 'TrueHD';
          audio_x.object = 'Atmos';
        } else if (audio_x.format.match(/DTS XLL X/)) {
          audio_x.format = 'DTS:X';
        } else if (audio_x.format.match(/MLP FBA/)) {
          audio_x.format = 'TrueHD';
        } else if (audio_x.format.match(/(DTS XLL|DTS ES XLL|DTS ES XXCH XLL)/)) {
          audio_x.format = 'DTS-HD MA';
        } else if (audio_x.format.match(/(DTS XBR)/)) {
          audio_x.format = 'DTS-HD HR';
        } else if (audio_x.format.match(/PCM/)) {
          audio_x.format = 'LPCM';
        } else if (audio_x.format.match(/FLAC/)) {
          audio_x.format = 'FLAC';
        } else if (audio_x.format.match(/DTS LBR/)) {
          audio_x.format = 'DTSE';
        } else if (audio_x.format.match(/Opus/)) {
          audio_x.format = 'Opus';
        } else if (audio_x.format.match(/AAC/)) {
          audio_x.format = 'AAC';
        } else if (audio_x.format.match(/DTS/)) {
          audio_x.format = 'DTS';
        } else if (audio_x.format.match(/E-AC-3 JOC/)) {
          audio_x.format = 'DDP';
          audio_x.object = 'Atmos';
        } else if (audio_x.format.match(/E-AC-3/)) {
          audio_x.format = 'DDP';
        } else if (audio_x.format.match(/AC-3/)) {
          audio_x.format = 'DD';
        } else if (audio_x.format.match(/MPEG Audio/)) {
          audio_x.format = 'MPEG';
        }
      }
      if (audio_x.format == 'MPEG' && stream.match(/Format profile.*Layer 2/)) {
        audio_x.format = 'MP2';
      } else if (audio_x.format == 'MPEG' && stream.match(/Format profile.*Layer 3/)) {
        audio_x.format = 'MP3';
      }
      if (stream.match(/(Channel layout|ChannelLayout_Original|声道布局).*/i)) {
        let channel_layout = stream.match(
          /(?<=(Channel layout|ChannelLayout_Original|声道布局)).*/i
        )[0];
        let channels = 0;
        if (channel_layout.match(/LFE/i)) {
          channels += 0.1;
          channel_layout = channel_layout.replace(channel_layout.match(/LFE/i), '');
        }
        if (channel_layout.match(/Lss?/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/Lss?/i), '');
        }
        if (channel_layout.match(/Rss?/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/Rss?/i), '');
        }
        if (channel_layout.match(/Cb/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/Cb/i), '');
        }
        if (channel_layout.match(/Lb/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/Lb/i), '');
        }
        if (channel_layout.match(/Rb/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/Rb/i), '');
        }
        if (channel_layout.match(/(C|M)s?/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/C/i), '');
        }
        if (channel_layout.match(/L/i)) {
          channels += 1;
          channel_layout = channel_layout.replace(channel_layout.match(/L/i), '');
        }
        if (channel_layout.match(/R/i)) {
          channels += 1;
        }
        audio_x.channels = channels.toFixed(1).toString();
      } else if (stream.match(/Channel positions.*Front: L C R, Side: L R, Back: L R, LFE/i)) {
        audio_x.channels = '7.1';
      } else if (stream.match(/Channel positions.*Front: L C R, Side: L R, LFE/i)) {
        audio_x.channels = '5.1';
      } else if (stream.match(/Channel\(s\).*6\schannels/i)) {
        audio_x.channels = '5.1';
      } else if (stream.match(/Channel\(s\).*[12].*/i)) {
        audio_x.channels = stream.match(/Channel\(s\).*[12].*/i)[0].match(/[12]/)[0] + '.0';
      }
      //判断音轨语言
      if (stream.match(/Title.*/)) {
        TORRENT_INFO.mediaInfo.video.audio_lang += 1;
        audio_x.title = stream.match(/Title.*/)[0];
        if (audio_x.title.match(/(国语|普通话|国配|台配|Mandarin)/)) {
          audioTitle = 1;
        }
        if (audio_x.title.match(/(粤语|粵語|粤配|Cantonese)/)) {
          audioTitle = 3;
        }
      } else {
        audio_x.title = null;
      }
      if (stream.match(/(Language|语言).*/)) {
        TORRENT_INFO.mediaInfo.video.audio_lang += 1;
        audio_x.lang = stream.match(/(Language|语言).*/)[0];
        if (audio_x.lang.match(/(Chinese|Mandarin)/i)) {
          audioLang = 5;
        }
        if (audio_x.lang.match(/(Cantonese)/i)) {
          audioLang = 9;
        }
      } else {
        audio_x.lang = null;
      }
      audioAdd = audioTitle + audioLang;
      console.log(`audioAdd ${audioAdd}`);
      if (audioAdd == 1) {
        TORRENT_INFO.mediaInfo.hasMandarin = true;
      } else if (audioAdd == 3) {
        TORRENT_INFO.mediaInfo.hasCantonese = true;
      } else if (audioAdd == 6) {
        TORRENT_INFO.mediaInfo.hasMandarin = true;
      } else if (audioAdd == 12) {
        TORRENT_INFO.mediaInfo.hasCantonese = true;
      } else if (audioAdd == 5) {
        TORRENT_INFO.mediaInfo.hasMandarin = true;
      } else if (audioAdd == 9 || audioAdd == 8) {
        TORRENT_INFO.mediaInfo.hasCantonese = true;
      }
      let key = 'audio' + i;
      TORRENT_INFO.mediaInfo.audios[key] = audio_x;
      match = mediaInfo.match(
        /\n(Audio|音频).*\n[\s\S]*?(?=(\n(Audio|音频).*\nID|\n(Text|文本).*\nID|$))/gi
      );
    }
    console.log(mediaInfo);
    //Subtitles
    match = mediaInfo.match(/\n(Text|文本).*\n[\s\S]*?(?=(\n(Text|文本).*\nID|$))/gi);
    for (let i = 1; match; i++) {
      stream = match[0].trim();
      console.log(stream);
      mediaInfo = mediaInfo.replace(stream, '');
      let text_x = {
        title: '',
        lang: '',
      };
      if (stream.match(/(Language|语言).*(Chinese|Mandarin)/i)) {
        TORRENT_INFO.mediaInfo.hasChineseSubtitles = true;
        if (stream.match(/Title.*(cht&eng|中英|chs&eng)/i)) {
          TORRENT_INFO.mediaInfo.hasEnglishSubtitles = true;
        }
      }
      if (stream.match(/(Language|语言).*English/i)) {
        TORRENT_INFO.mediaInfo.hasEnglishSubtitles = true;
      }
      let key = 'text' + i;
      TORRENT_INFO.mediaInfo.subtitles[key] = text_x;
      match = mediaInfo.match(/\n(Text|文本).*\n[\s\S]*?(?=(\n(Text|文本).*\nID|$))/gi);
    }
  }
  if (bdInfo && !mediaInfo) {
    bdInfo = bdInfo.replace(/\u2002/g, ' ');
    console.log(bdInfo);
    TORRENT_INFO.bdInfo.full = bdInfo;
    if (TORRENT_INFO.tableInfo.subtitle.match(/DIY/i)) {
      TORRENT_INFO.bdInfo.DIY = true;
    }
    let ai = 1;
    let si = 1;
    //Video
    let bdInfo_rows = [];
    bdInfo.split('\n').forEach((r) => {
      if (r.match(/ kbps/)) {
        bdInfo_rows.push(r);
      }
    });
    bdInfo_rows.forEach((r) => {
      console.log(r);
      if (r.match(/Video/) && TORRENT_INFO.bdInfo.video.format == '') {
        //format
        if (r.match('AVC')) {
          TORRENT_INFO.bdInfo.video.format = 'AVC';
        } else if (r.match('HEVC')) {
          TORRENT_INFO.bdInfo.video.format = 'HEVC';
        } else if (r.match('VC-1')) {
          TORRENT_INFO.bdInfo.video.format = 'VC-1';
        } else if (r.match('MPEG-2')) {
          TORRENT_INFO.bdInfo.video.format = 'MPEG-2';
        }
        //bitrates
        if (r.match(/[0-9]{1,5} kbps/)) {
          TORRENT_INFO.bdInfo.video.bitrates = r.match(/[0-9]{1,5} kbps/)[0];
        }
        //resolution
        if (r.match(/[1-2][0-9]{3}(p|i)/)) {
          TORRENT_INFO.bdInfo.video.resolution = r.match(/[1-2][0-9]{3}(p|i)/)[0];
        } else {
          TORRENT_INFO.bdInfo.video.resolution = r.match(/[0-8]{3}(p|i)/)[0];
        }
        //HDR
        if (r.match(/HDR10\+/)) {
          TORRENT_INFO.bdInfo.video.hdr = 'HDR10+';
          TORRENT_INFO.results.hdr = 'HDR10+';
        } else if (r.match(/HDR/)) {
          TORRENT_INFO.bdInfo.video.hdr = 'HDR';
          TORRENT_INFO.results.hdr = 'HDR';
        }
      } else if (r.match(/Video/) && r.match(/Dolby Vision/)) {
        //DV
        if (r.match(/[0-9]{1,5} kbps/)) {
          TORRENT_INFO.bdInfo.video_dv = r.match(/[0-9]{1,5} kbps/)[0];
        }
        TORRENT_INFO.bdInfo.video.dv = true;
        TORRENT_INFO.results.dv = true;
      } //Subtitles
      else if (r.match(/(Subtitle|Presentation Graphics)/)) {
        if (r.match('Chinese')) {
          TORRENT_INFO.bdInfo.subtitles.push('Mandarin');
          TORRENT_INFO.mediaInfo.hasChineseSubtitles = true;
        }
        if (r.match('English') || r.match('英')) {
          TORRENT_INFO.bdInfo.subtitles.push('English');
          TORRENT_INFO.mediaInfo.hasEnglishSubtitles = true;
        }
        TORRENT_INFO.bdInfo.subtitles.push('有字幕');
      } //Audios
      else if (r.match(/(Audio|kHz)/)) {
        let audio_x = {
          format: '',
          channels: '',
          lang: '',
          object: '',
        };
        //format
        if (r.match(/Dolby TrueHD\/Atmos Audio/)) {
          audio_x.format = 'TrueHD';
          audio_x.object = 'Atmos';
        } else if (r.match(/Dolby TrueHD Audio/)) {
          audio_x.format = 'TrueHD';
        } else if (r.match(/DTS-HD Master Audio/)) {
          audio_x.format = 'DTS-HD MA';
        } else if (r.match(/DTS-HD High-Res/)) {
          audio_x.format = 'DTS-HD HR';
        } else if (r.match(/DTS/)) {
          audio_x.format = 'DTS';
        } else if (r.match(/Dolby Digital Plus Audio/)) {
          audio_x.format = 'DDP';
        } else if (r.match(/Dolby Digital Audio/)) {
          audio_x.format = 'DD';
        } else if (r.match(/LPCM Audio/)) {
          audio_x.format = 'LPCM';
        } else {
          audio_x.format = 'Unknown';
        }
        //channels
        if (r.match(/[1-7]\.[0-1]( |-ES )\//)) {
          audio_x.channels = r
            .match(/[1-7]\.[0-1]( |-ES )\//)[0]
            .replace('-ES', '')
            .replace(' /', '');
        }
        //language
        if (r.match('Chinese')) {
          audio_x.lang = 'Mandarin';
          TORRENT_INFO.mediaInfo.hasMandarin = true;
        } else if (r.match('Cantonese')) {
          audio_x.lang = 'Cantonese';
          TORRENT_INFO.mediaInfo.hasCantonese = true;
        }
        let key = 'audio' + ai;
        ai++;
        TORRENT_INFO.bdInfo.audios[key] = audio_x;
      }
    });
  }
  //获取 titleInfo
  let title = document.getElementById('top');
  //分离主标题和免费信息
  TORRENT_INFO.titleInfo.origin = title.firstChild.textContent.trim();
  TORRENT_INFO.titleInfo.freeinfo = title.textContent.replace(TORRENT_INFO.titleInfo.origin, '');
  TORRENT_INFO.results.title = TORRENT_INFO.titleInfo.origin;
  //获取台标
  if (TORRENT_INFO.results.title.match(/(CCTV4K)/i)) {
    match = TORRENT_INFO.results.title.match(/(CCTV4K)/i);
    TORRENT_INFO.titleInfo.logo = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Logo##');
  }
  //获取：标题 REMUX 信息
  if (TORRENT_INFO.results.title.match(/Remux/i)) {
    TORRENT_INFO.titleInfo.remux = true;
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
      TORRENT_INFO.results.title.match(/Remux/i)[0],
      '##REMUX##'
    );
  }
  //获取：标题来源1
  if (TORRENT_INFO.results.title.match(/Blu-?ray/i)) {
    match = TORRENT_INFO.results.title.match(/Blu-?ray/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'Blu-ray';
    //获取：标题来源2
  } else if (TORRENT_INFO.results.title.match(/WEB-?DL/i)) {
    match = TORRENT_INFO.results.title.match(/WEB-?DL/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'WEB-DL';
    //获取标题来源3
  } else if (TORRENT_INFO.results.title.match(/WEBRip/i)) {
    match = TORRENT_INFO.results.title.match(/WEBRip/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'WEBRip';
    //获取标题来源4
  } else if (TORRENT_INFO.results.title.match(/HDTVRip/i)) {
    match = TORRENT_INFO.results.title.match(/HDTVRip/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'HDTVRip';
    //获取标题来源5
  } else if (TORRENT_INFO.results.title.match(/HDTV/i)) {
    match = TORRENT_INFO.results.title.match(/HDTV/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'HDTV';
    //获取标题来源6
  } else if (TORRENT_INFO.results.title.match(/DVDRip/i)) {
    match = TORRENT_INFO.results.title.match(/DVDRip/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'DVDRip';
    //获取标题来源6
  } else if (
    TORRENT_INFO.results.title.match(/DVD[59]?/i) &&
    TORRENT_INFO.results.title.match(/(PAL|NTSC)/i)
  ) {
    match = TORRENT_INFO.results.title.match(/DVD[59]?/i);
    TORRENT_INFO.titleInfo.source = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Source##');
    TORRENT_INFO.results.source = 'DVD';
    match = TORRENT_INFO.results.title.match(/(PAL|NTSC)/i);
    TORRENT_INFO.titleInfo.standard = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Standard##');
  } else {
    checkResultBox.innerHTML += '<span>主标题缺少来源</span><br>';
  }
  //获取标题视频编码
  if (
    TORRENT_INFO.results.title.match(
      /(HEVC|AVC|x264|x265|H(\.|\s)?264|H(\.|\s)?265|Xvid|VC-?1|MPEG-?2|AV1|VP9)/i
    )
  ) {
    match = TORRENT_INFO.results.title.match(
      /(HEVC|AVC|x264|x265|H(\.|\s)?264|H(\.|\s)?265|Xvid|VC-?1|MPEG-?2|AV1|VP9)/i
    );
    TORRENT_INFO.titleInfo.vcodec = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Vcodec##');
  } else {
    checkResultBox.innerHTML += '<span>主标题缺少视频编码</span><br>';
  }
  if (TORRENT_INFO.results.source != 'DVDRip') {
    //获取标题视频分辨率1
    if (TORRENT_INFO.results.title.match(/(480i|480p|576p|720p|1080p|2160p|4320p)/i)) {
      match = TORRENT_INFO.results.title.match(/(480i|480p|576p|720p|1080p|2160p|4320p)/i);
      TORRENT_INFO.titleInfo.resolution = match[0].trim();
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Resolution##');
      //获取标题视频分辨率2
    } else if (TORRENT_INFO.results.title.match(/8K/i)) {
      match = TORRENT_INFO.results.title.match(/8K/i);
      TORRENT_INFO.titleInfo.resolution = '4320p';
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Resolution##');
      //获取标题视频分辨率3
    } else if (TORRENT_INFO.results.title.match(/4K/i)) {
      match = TORRENT_INFO.results.title.match(/4K/i);
      TORRENT_INFO.titleInfo.resolution = '2160p';
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Resolution##');
      //获取标题视频分辨率3
    } else if (TORRENT_INFO.results.title.match(/1080i/i)) {
      match = TORRENT_INFO.results.title.match(/1080i/i);
      TORRENT_INFO.titleInfo.resolution = '1080i';
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace('1080i', '##Resolution##');
    } else {
      checkResultBox.innerHTML += '<span>主标题缺少分辨率</span><br>';
    }
  } else {
    //获取 DVDRip 标题视频分辨率1
    if (TORRENT_INFO.results.title.match(/(480p|576p|720p|1080p)/i)) {
      match = TORRENT_INFO.results.title.match(/(480p|576p|720p|1080p)/i);
      TORRENT_INFO.titleInfo.resolution = match[0].trim();
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Resolution##');
    }
  }
  //获取标题音频对象1
  if (TORRENT_INFO.results.title.match(/Atmos/i)) {
    TORRENT_INFO.titleInfo.aobject = 'Atmos';
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(/Atmos/i, '##Atmos##');
    //获取标题音频对象2
  } else if (TORRENT_INFO.results.title.match(/DDPA/i)) {
    TORRENT_INFO.titleInfo.aobject = 'A';
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(/DDPA/i, 'DDP##Atmos##');
  }
  //获取前置：标题拆分
  console.log(`TORRENT_INFO.titleInfo.origin ${TORRENT_INFO.titleInfo.origin}`);
  if (TORRENT_INFO.titleInfo.source != '') {
    title = TORRENT_INFO.titleInfo.origin
      .replace(TORRENT_INFO.titleInfo.source, '##Source##')
      .split('##Source##');
    title[1] = TORRENT_INFO.titleInfo.origin
      .replace(title[0], '')
      .replace(TORRENT_INFO.titleInfo.source, '')
      .replace(TORRENT_INFO.titleInfo.resolution, '')
      .replace('Remux', '')
      .replace(TORRENT_INFO.titleInfo.vcodec, '');
    //剩下制作组、音频编码、音频通道、HDR 信息、HQ 等
    title[0] = title[0]
      .replace(TORRENT_INFO.titleInfo.resolution, '')
      .replace('Remux', '')
      .replace(TORRENT_INFO.titleInfo.vcodec, '');
    //剩下片名、年份、季数、集数、剪辑版本、Hybrid 等
  } else if (TORRENT_INFO.titleInfo.resolution != '') {
    title = TORRENT_INFO.titleInfo.origin
      .replace(TORRENT_INFO.titleInfo.resolution, '##Resolution##')
      .split('##Resolution##');
    title[1] = TORRENT_INFO.titleInfo.origin
      .replace(title[0], '')
      .replace(TORRENT_INFO.titleInfo.resolution, '')
      .replace(TORRENT_INFO.titleInfo.source, '')
      .replace('Remux', '')
      .replace(TORRENT_INFO.titleInfo.vcodec, '');
    //剩下片名、年份、季数、集数、剪辑版本、Hybrid 等
    title[0] = title[0]
      .replace(TORRENT_INFO.titleInfo.source, '')
      .replace('Remux', '')
      .replace(TORRENT_INFO.titleInfo.vcodec, '');
    //剩下制作组、音频通道、HDR 信息、HQ 等
  }
  if (title[0] && title[1]) {
    console.log(`title[0] is ${title[0]}`);
    console.log(`title[1] is ${title[1]}`);
    //获取标题音频编码1
    if (
      title[1].match(
        /(DTS(-|\s|\.)?HD.?MA|DTS(-|\s\.)?HD.?HR|DD\+|DDP|LPCM|DTS.?X|MP2|EAC-?3|FLAC|TrueHD|AAC|OPUS)/gi
      )
    ) {
      match = title[1].match(
        /(DTS(-|\s|\.)?HD.?MA|DTS(-|\s\.)?HD.?HR|DD\+|DDP|LPCM|DTS.?X|MP2|EAC-?3|FLAC|TrueHD|AAC|OPUS)/gi
      );
      TORRENT_INFO.titleInfo.acodec = match[0].replace('.', ' ').trim();
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Acodec##');
      title[1] = title[1].replace(match[0], '');
      //获取标题音频编码2
    } else if (title[1].match(/(DTS|DD|PCM|AC-?3)/gi)) {
      match = title[1].match(/(DTS|DD|PCM|AC-?3)/gi);
      TORRENT_INFO.titleInfo.acodec = match[0].trim();
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Acodec##');
      title[1] = title[1].replace(match[0], '');
    }
    //获取标题音频通道
    if (title[1].match(/[1-7]\.[0-1]/gi)) {
      match = title[1].match(/[1-7]\.[0-1]/gi);
      TORRENT_INFO.titleInfo.channels = match[0].trim();
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Channels##');
      title[1] = title[1].replace(match[0], '');
    }
    //获取标题制作组
    if (title[1].match(/￡.*(-|@)FRDS/i)) {
      TORRENT_INFO.titleInfo.group = title[1].match(/￡.*(-|@)FRDS/i)[0].trim();
    } else {
      try {
        let groups = title[1].split('-');
        TORRENT_INFO.titleInfo.group += groups[1].trim();
        for (let i = 2; i < groups.length; i++) {
          TORRENT_INFO.titleInfo.group += '-';
          TORRENT_INFO.titleInfo.group += groups[i].trim();
        }
        if (TORRENT_INFO.titleInfo.group == '') {
          TORRENT_INFO.titleInfo.group = title[1].split('@')[1].trim();
        }
        TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
          TORRENT_INFO.titleInfo.group,
          '##Group##'
        );
      } catch (e) {
        console.log('无制作组');
      }
    }
    //获取季数
    if (title[0].match(/S[0-2][0-9]/i)) {
      match = title[0].match(/S[0-2][0-9]/i);
      TORRENT_INFO.titleInfo.season = match[0];
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Season##');
      title[0] = title[0].replace(match[0], '');
    }
    //获取集数
    if (title[0].match(/E[0-9]{1,4}-E?[0-9]{1,4}/)) {
      match = title[0].match(/E[0-9]{1,4}-E?[0-9]{1,4}/);
      let chapterArr = match[0].replaceAll('E', '').split('-');
      TORRENT_INFO.titleInfo.chapter1 = chapterArr[0];
      TORRENT_INFO.titleInfo.chapter2 = chapterArr[1];
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Chapters##');
      title[0] = title[0].replace(match[0], '');
    } else if (title[0].match(/E[0-9]{1,4}/)) {
      match = title[0].match(/E[0-9]{1,4}/);
      TORRENT_INFO.titleInfo.chapter1 = '-1';
      TORRENT_INFO.titleInfo.chapter2 = match[0].replaceAll('E', '');
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##Chapters##');
      title[0] = title[0].replace(match[0], '');
    } else {
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
        '##Season##',
        '##Season####Chapters##'
      );
    }
    //获取片名和年份
    console.log(TORRENT_INFO.results.title);
    TORRENT_INFO.titleInfo.name = TORRENT_INFO.results.title
      .replace('##Logo##', '')
      .split('##', 1)[0]
      .trim();
    //先获取一个片名
    if (TORRENT_INFO.descInfo.moviename.match(TORRENT_INFO.titleInfo.name)) {
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
        TORRENT_INFO.titleInfo.name,
        '##Name##'
      );
      //如果直接匹配，说明主标题没有年份可以获取或在季数后面
      match = TORRENT_INFO.results.title.match(/[1-2][0-9]{3}/g);
      if (match) {
        TORRENT_INFO.titleInfo.year = match[0];
        TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
          TORRENT_INFO.titleInfo.year,
          '##Year##'
        );
      }
    } else if (title[0].match(/[1-2][0-9]{3}/g)) {
      match = title[0].match(/[1-2][0-9]{3}/g);
      TORRENT_INFO.titleInfo.year = match[match.length - 1];
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
        TORRENT_INFO.titleInfo.year,
        '##Year##'
      );
      TORRENT_INFO.titleInfo.name = TORRENT_INFO.results.title
        .replace('##Logo##', '')
        .split('##', 1)[0]
        .trim();
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
        TORRENT_INFO.titleInfo.name,
        '##Name##'
      );
    } else {
      TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(
        TORRENT_INFO.titleInfo.name,
        '##Name##'
      );
    }
  }
  //获取标题 FPS
  if (TORRENT_INFO.results.title.match(/[0-9]{2,3}FPS/i)) {
    match = TORRENT_INFO.results.title.match(/[0-9]{2,3}FPS/i);
    TORRENT_INFO.titleInfo.fps = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##FPS##');
  }
  //获取标题 HDR
  if (TORRENT_INFO.results.title.match(/HDR10(\+|P)/i)) {
    match = TORRENT_INFO.results.title.match(/HDR10(\+|P)/i);
    TORRENT_INFO.titleInfo.hdr = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##HDR##');
  } else if (TORRENT_INFO.results.title.match(/HDR.Vivid/i)) {
    match = TORRENT_INFO.results.title.match(/HDR.Vivid/i);
    TORRENT_INFO.titleInfo.hdr = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##HDR##');
  } else if (TORRENT_INFO.results.title.match(/HDR(10)?/i)) {
    match = TORRENT_INFO.results.title.match(/HDR(10)?/i);
    TORRENT_INFO.titleInfo.hdr = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##HDR##');
  } else if (TORRENT_INFO.results.title.match(/HLG/i)) {
    TORRENT_INFO.titleInfo.hdr = 'HLG';
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace('HLG', '##HDR##');
  }
  //获取标题 DV
  if (TORRENT_INFO.results.title.match(/(DV|DoVi)/i)) {
    match = TORRENT_INFO.results.title.match(/(DV|DoVi)/i);
    TORRENT_INFO.titleInfo.dv = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##DoVi##');
  }
  //获取 10bit
  if (TORRENT_INFO.results.title.match(/10bits?/i)) {
    match = TORRENT_INFO.results.title.match(/10bits?/i);
    TORRENT_INFO.titleInfo.bitdepth = match[0];
    TORRENT_INFO.results.title = TORRENT_INFO.results.title.replace(match[0], '##BitDepth##');
  }
  TORRENT_INFO.results.title = TORRENT_INFO.results.title
    .replace('##Name####', '##Name## ##')
    .replace(/\./g, ' ');

  //逻辑：重要检查
  //逻辑：mediaInfo 检查
  if (TORRENT_INFO.mediaInfo.full != '' || infoSp) {
    //逻辑：标题媒介检查
    if (TORRENT_INFO.titleInfo.remux) {
      TORRENT_INFO.results.zhiliang = 'REMUX';
    } else if (
      TORRENT_INFO.results.source == 'Blu-ray' &&
      TORRENT_INFO.mediaInfo.video.codec.match(/(x264|x265|Xvid)/i)
    ) {
      TORRENT_INFO.results.zhiliang = 'Encode';
    } else if (
      TORRENT_INFO.results.source == 'Blu-ray' &&
      TORRENT_INFO.titleInfo.group.match(
        /(FRDS|beAst|WScode|Dream|WiKi|CMCT|ANK-Raws|TLF|HDH$|HDS$)/i
      )
    ) {
      if (TORRENT_INFO.mediaInfo.video.bitrates > 50000 && TORRENT_INFO.results.resolution > 1080) {
        console.log('质量可能为 REMUX');
        TORRENT_INFO.results.zhiliang = 'REMUX';
      } else if (
        TORRENT_INFO.mediaInfo.video.bitrates > 15600 &&
        TORRENT_INFO.results.resolution <= 1080
      ) {
        console.log('质量可能为 REMUX');
        TORRENT_INFO.results.zhiliang = 'REMUX';
      } else {
        TORRENT_INFO.results.zhiliang = 'Encode';
      }
    } else if (
      TORRENT_INFO.results.source == 'WEB-DL' &&
      TORRENT_INFO.titleInfo.group.match(/(FRDS)/i)
    ) {
      TORRENT_INFO.results.zhiliang = 'Encode';
    } else if (TORRENT_INFO.results.source == 'WEB-DL') {
      TORRENT_INFO.results.zhiliang = 'WEB-DL';
    } else if (TORRENT_INFO.results.source == 'WEBRip') {
      TORRENT_INFO.results.zhiliang = 'Encode';
    } else if (TORRENT_INFO.results.source == 'HDTVRip') {
      TORRENT_INFO.results.zhiliang = 'Encode';
    } else if (TORRENT_INFO.results.source == 'HDTV') {
      TORRENT_INFO.results.zhiliang = 'HDTV';
    } else if (TORRENT_INFO.results.source == 'DVDRip') {
      TORRENT_INFO.results.zhiliang = 'Encode';
    } else if (TORRENT_INFO.results.source == 'DVD') {
      TORRENT_INFO.results.zhiliang = 'DVD';
    } else {
      console.log('mediaInfo 质量为 Unknown');
    }
    //逻辑：视频编码检查
    if (TORRENT_INFO.mediaInfo.video.format == 'MPEG-2') {
      TORRENT_INFO.results.vcodec = 'MPEG-2';
    } else if (TORRENT_INFO.mediaInfo.video.codec == 'XviD') {
      TORRENT_INFO.results.vcodec = 'XviD';
    } else if (TORRENT_INFO.mediaInfo.video.format.match(/AV1/)) {
      TORRENT_INFO.results.vcodec = 'AV1';
    } else if (TORRENT_INFO.mediaInfo.video.format.match(/VP9/i)) {
      TORRENT_INFO.results.vcodec = 'VP9';
    } else if (TORRENT_INFO.mediaInfo.video.format.match(/VC-1/)) {
      TORRENT_INFO.results.vcodec = 'VC-1';
    } else if (TORRENT_INFO.results.zhiliang == 'REMUX') {
      if (TORRENT_INFO.mediaInfo.video.format.match(/AVC/)) {
        TORRENT_INFO.results.vcodec = 'AVC';
      } else if (TORRENT_INFO.mediaInfo.video.format.match(/HEVC/)) {
        TORRENT_INFO.results.vcodec = 'HEVC';
      } else if (TORRENT_INFO.mediaInfo.video.format.match(/VC-1/)) {
        TORRENT_INFO.results.vcodec = 'VC-1';
      }
    } else if (TORRENT_INFO.results.zhiliang == 'Encode') {
      if (
        TORRENT_INFO.mediaInfo.video.format.match(/AVC/) ||
        TORRENT_INFO.mediaInfo.video.codec.match(/x264/)
      ) {
        TORRENT_INFO.results.vcodec = 'x264';
      } else if (
        TORRENT_INFO.mediaInfo.video.format.match(/HEVC/) ||
        TORRENT_INFO.mediaInfo.video.codec.match(/x265/)
      ) {
        TORRENT_INFO.results.vcodec = 'x265';
      }
    } else if (TORRENT_INFO.mediaInfo.video.codec.match(/(x264|x265|Xvid)/i)) {
      TORRENT_INFO.results.vcodec = TORRENT_INFO.mediaInfo.video.codec;
    } else if (TORRENT_INFO.mediaInfo.video.format.match(/AVC/)) {
      TORRENT_INFO.results.vcodec = 'H264';
    } else if (TORRENT_INFO.mediaInfo.video.format.match(/HEVC/)) {
      TORRENT_INFO.results.vcodec = 'H265';
    } else if (false) {
      TORRENT_INFO.results.vcodec = 'MPEG-2';
    } else {
      console.log(`mediaInfo 视频编码为 ${TORRENT_INFO.mediaInfo.video.format}`);
    }
    //逻辑：音频编码检查
    //逻辑：分辨率检查
    let minusresult = TORRENT_INFO.mediaInfo.video.width - TORRENT_INFO.mediaInfo.video.height;
    console.log(minusresult);
    if (TORRENT_INFO.mediaInfo.video.width < TORRENT_INFO.mediaInfo.video.height) {
      minusresult = 0 - minusresult;
      console.log(`竖屏短剧宽小于高 ${minusresult}`);
    }
    if (minusresult > 4096 - 1248) {
      console.log('分辨率为 4320p');
      TORRENT_INFO.results.resolution = '4320';
    } else if (
      minusresult > 1920 - 672 ||
      (TORRENT_INFO.mediaInfo.video.width > TORRENT_INFO.mediaInfo.video.height &&
        TORRENT_INFO.mediaInfo.video.height == 2160)
    ) {
      console.log('分辨率为 2160p');
      TORRENT_INFO.results.resolution = '2160';
    } else if (
      minusresult > 1280 - 500 ||
      (TORRENT_INFO.mediaInfo.video.width > TORRENT_INFO.mediaInfo.video.height &&
        TORRENT_INFO.mediaInfo.video.height == 1080)
    ) {
      console.log('分辨率为 1080');
      TORRENT_INFO.results.resolution = '1080';
    } else if (
      minusresult > 1024 - 520 ||
      (TORRENT_INFO.mediaInfo.video.width > 1260 && TORRENT_INFO.mediaInfo.video.width <= 1280) ||
      TORRENT_INFO.mediaInfo.video.height == 720
    ) {
      console.log('分辨率为 720p');
      TORRENT_INFO.results.resolution = '720';
    } else if (
      TORRENT_INFO.mediaInfo.video.height > 480 &&
      TORRENT_INFO.mediaInfo.video.height <= 576
    ) {
      console.log('分辨率为 576p');
      TORRENT_INFO.results.resolution = '576';
    } else if (
      TORRENT_INFO.mediaInfo.video.height > 350 &&
      TORRENT_INFO.mediaInfo.video.height <= 480
    ) {
      console.log('分辨率为 480p');
      TORRENT_INFO.results.resolution = '480';
    } else {
      console.log(`mediaInfo 分辨率为 ${TORRENT_INFO.titleInfo.resolution}?`);
    }
    if (TORRENT_INFO.mediaInfo.full != '' && TORRENT_INFO.results.resolution != '') {
      if (TORRENT_INFO.mediaInfo.video.scantype.match(/(Interlaced|MBAFF|隔行扫描)/i)) {
        TORRENT_INFO.results.resolution += 'i';
      } else {
        TORRENT_INFO.results.resolution += 'p';
      }
    } else if (TORRENT_INFO.results.resolution != '') {
      if (TORRENT_INFO.results.source == 'HDTV' && TORRENT_INFO.results.resolution != '2160') {
        TORRENT_INFO.results.resolution += 'i';
      } else {
        TORRENT_INFO.results.resolution += 'p';
      }
    }
  } else if (TORRENT_INFO.bdInfo.full != '') {
    //逻辑：标题媒介检查
    if (TORRENT_INFO.bdInfo.video.resolution == '2160p') {
      console.log('质量为 UHD Discs');
      TORRENT_INFO.results.zhiliang = 'UHD';
      TORRENT_INFO.results.source = 'Blu-ray';
    } else if (TORRENT_INFO.bdInfo.video.resolution.match(/1080/)) {
      console.log('质量为 BD Discs');
      TORRENT_INFO.results.zhiliang = 'BD';
      TORRENT_INFO.results.source = 'Blu-ray';
    } else {
      console.log('bdInfo 质量为 Unknown');
    }
    //逻辑：分辨率检查
    TORRENT_INFO.results.resolution = TORRENT_INFO.bdInfo.video.resolution;
    //逻辑：视频编码检查
    TORRENT_INFO.results.vcodec = TORRENT_INFO.bdInfo.video.format;
    //逻辑：音频编码检查
  }
  //逻辑：类型
  if (TORRENT_INFO.descInfo.category == '纪录片') {
    TORRENT_INFO.results.category = '纪录片';
  } else if (TORRENT_INFO.tableInfo.subtitle.match('演唱会')) {
    TORRENT_INFO.results.category = '舞台演出';
  } else if (TORRENT_INFO.descInfo.category == '动画') {
    TORRENT_INFO.results.category = '动画';
  } else if (TORRENT_INFO.descInfo.category == '综艺') {
    TORRENT_INFO.results.category = '综艺';
  } else if (
    TORRENT_INFO.descInfo.chapters != '' ||
    TORRENT_INFO.tableInfo.subtitle.match(/短剧/) ||
    TORRENT_INFO.tableInfo.chapter2 != ''
  ) {
    TORRENT_INFO.results.category = '电视剧';
  } else if (TORRENT_INFO.descInfo.category != '') {
    TORRENT_INFO.results.category = '电影';
  }
  //逻辑：季数
  if (TORRENT_INFO.titleInfo.season != '') {
    if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(1|一)\s?季/)) {
      TORRENT_INFO.results.season = 'S01';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(2|二)\s?季/)) {
      TORRENT_INFO.results.season = 'S02';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(3|三)\s?季/)) {
      TORRENT_INFO.results.season = 'S03';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(4|四)\s?季/)) {
      TORRENT_INFO.results.season = 'S04';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(5|五)\s?季/)) {
      TORRENT_INFO.results.season = 'S05';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(6|六)\s?季/)) {
      TORRENT_INFO.results.season = 'S06';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(7|七)\s?季/)) {
      TORRENT_INFO.results.season = 'S07';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(8|八)\s?季/)) {
      TORRENT_INFO.results.season = 'S08';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?0?(9|九)\s?季/)) {
      TORRENT_INFO.results.season = 'S09';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(10|十)\s?季/)) {
      TORRENT_INFO.results.season = 'S10';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(11|十一)\s?季/)) {
      TORRENT_INFO.results.season = 'S11';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(12|十二)\s?季/)) {
      TORRENT_INFO.results.season = 'S12';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(13|十三)\s?季/)) {
      TORRENT_INFO.results.season = 'S13';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(14|十四)\s?季/)) {
      TORRENT_INFO.results.season = 'S14';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(15|十五)\s?季/)) {
      TORRENT_INFO.results.season = 'S15';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(16|十六)\s?季/)) {
      TORRENT_INFO.results.season = 'S16';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(17|十七)\s?季/)) {
      TORRENT_INFO.results.season = 'S17';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(18|十八)\s?季/)) {
      TORRENT_INFO.results.season = 'S18';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(19|十九)\s?季/)) {
      TORRENT_INFO.results.season = 'S19';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(20|二十)\s?季/)) {
      TORRENT_INFO.results.season = 'S20';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(21|二十一)\s?季/)) {
      TORRENT_INFO.results.season = 'S21';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(22|二十二)\s?季/)) {
      TORRENT_INFO.results.season = 'S22';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(23|二十三)\s?季/)) {
      TORRENT_INFO.results.season = 'S23';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(24|二十四)\s?季/)) {
      TORRENT_INFO.results.season = 'S24';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(25|二十五)\s?季/)) {
      TORRENT_INFO.results.season = 'S25';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(26|二十六)\s?季/)) {
      TORRENT_INFO.results.season = 'S26';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(27|二十七)\s?季/)) {
      TORRENT_INFO.results.season = 'S27';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(28|二十八)\s?季/)) {
      TORRENT_INFO.results.season = 'S28';
    } else if (TORRENT_INFO.tableInfo.subtitle.match(/第\s?(29|二十九)\s?季/)) {
      TORRENT_INFO.results.season = 'S29';
    } else {
      TORRENT_INFO.results.season = 'S01';
    }
  }
  //逻辑：文件
  let filelist;
  jQuery.ajax({
    async: false,
    type: 'get',
    url: window.location.href.replace('details', 'viewfilelist'),
    datatype: 'json',
    success: function (data) {
      filelist = data;
    },
  });
  let filelistArr = filelist.split('<tr>');
  TORRENT_INFO.results.files = filelistArr.length - 2;
  let errorFileNum = 0;
  let fileTypes = [];
  if (TORRENT_INFO.results.zhiliang.match(/(BD|UHD)/)) {
    for (let i = 2; i < filelistArr.length; i++) {
      let fileTemp = filelistArr[i];
      let num1 = fileTemp.indexOf('>');
      fileTemp = fileTemp.slice(num1 + 1);
      let num2 = fileTemp.indexOf('</');
      fileTemp = fileTemp.slice(0, num2);
      let fileLastDotNum = fileTemp.lastIndexOf('.');
      let fileType = fileTemp.slice(fileLastDotNum);
      if (
        filelistArr[i].match(
          /\/dbmv\/stream|\/dbmv\/clipinf|\/dbmv\/playlist|\/bdmv\/backup\/clipinf|\/bdmv\/backup\/playlist/gi
        )
      ) {
        if (fileType.match(/\.clpi|\.mpls|\.m2ts/gi)) {
        } else {
          errorFileNum += 1;
          fileTypes.push(fileType);
        }
      }
    }
  } else if (TORRENT_INFO.results.zhiliang == 'DVD') {
    for (let i = 2; i < filelistArr.length; i++) {
      let num1 = filelistArr[i].indexOf('>');
      filelistArr[i] = filelistArr[i].slice(num1 + 1);
      let num2 = filelistArr[i].indexOf('</');
      filelistArr[i] = filelistArr[i].slice(0, num2);
      let fileLastDotNum = filelistArr[i].lastIndexOf('.');
      let fileType = filelistArr[i].slice(fileLastDotNum);
      if (fileType.match(/\.vob|\.iso|\.ifo|\.bup/gi)) {
      } else {
        errorFileNum += 1;
        fileTypes.push(fileType);
      }
    }
  } else {
    for (let i = 2; i < filelistArr.length; i++) {
      let num1 = filelistArr[i].indexOf('>');
      filelistArr[i] = filelistArr[i].slice(num1 + 1);
      let num2 = filelistArr[i].indexOf('</');
      filelistArr[i] = filelistArr[i].slice(0, num2);
      let fileLastDotNum = filelistArr[i].lastIndexOf('.');
      let fileType = filelistArr[i].slice(fileLastDotNum);
      if (fileType.match(/\.mkv|\.mp4|\.vob|\.m2ts|\.ts|\.avi|\.mov/gi)) {
      } else {
        errorFileNum += 1;
        fileTypes.push(fileType);
      }
    }
  }
  //逻辑：集数
  if (TORRENT_INFO.tableInfo.chapter2 == '') {
    TORRENT_INFO.results.chapter2 = TORRENT_INFO.descInfo.chapters;
  } else {
    TORRENT_INFO.results.chapter1 = TORRENT_INFO.tableInfo.chapter1;
    TORRENT_INFO.results.chapter2 = TORRENT_INFO.tableInfo.chapter2;
  }

  //页面提醒
  correctTitle = '<br><span>' + TORRENT_INFO.results.title + '</span>';
  correctTitle = correctTitle.replace('##Logo##', TORRENT_INFO.titleInfo.logo);
  //预处理
  correctTitle = correctTitle
    .replace(/HQ/i, '<span style="color: white">HQ</span>')
    .replace(/EDR/i, '<span style="color: white">EDR</span>');
  match = correctTitle.match(/[2-9]?Audios?/i);
  if (match) {
    correctTitle = correctTitle.replace(
      /[2-9]?Audios?/i,
      `<span style="color: white">${match[0]}</span>`
    );
  }
  //判断：类型
  if (
    TORRENT_INFO.tableInfo.category.match(TORRENT_INFO.results.category) &&
    TORRENT_INFO.results.category != ''
  ) {
    checkResultBox.innerHTML += '<span>必有 1：类型选择正确</span><br>';
  } else if (TORRENT_INFO.results.category == '') {
    checkResultBox.innerHTML += '<span style="color: orange">必有 1：类型未判断</span><br>';
  } else {
    checkResultBox.innerHTML += `<span style="color: red">必有 1：类型选择错误，类型应为 ${TORRENT_INFO.results.category}</span><br>`;
  }
  //判断：质量
  if (
    TORRENT_INFO.tableInfo.zhiliang.match(TORRENT_INFO.results.zhiliang) &&
    TORRENT_INFO.results.zhiliang != ''
  ) {
    checkResultBox.innerHTML += '<span>必有 2：质量选择正确</span><br>';
  } else if (TORRENT_INFO.results.zhiliang == '') {
    checkResultBox.innerHTML += '<span style="color: orange">必有 2：质量未判断</span><br>';
  } else {
    checkResultBox.innerHTML += `<span style="color: red">必有 2：质量选择错误，应为 ${TORRENT_INFO.results.zhiliang}</span><br>`;
  }
  //判断：地区
  if (
    TORRENT_INFO.tableInfo.area.match(/大陆/) &&
    TORRENT_INFO.descInfo.area.match(/(大陆|中国)/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为中国大陆</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/香港/) &&
    TORRENT_INFO.descInfo.area.match(/香港/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为香港</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/台湾/) &&
    TORRENT_INFO.descInfo.area.match(/台湾/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为台湾</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/欧美/) &&
    TORRENT_INFO.descInfo.area.match(
      /(英国|美国|法国|西班牙|德国|俄罗斯|意大利|加拿大|墨西哥|瑞典|加拿大|澳大利亚)/
    )
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为欧美</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/日本/) &&
    TORRENT_INFO.descInfo.area.match(/日本/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为日本</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/韩国/) &&
    TORRENT_INFO.descInfo.area.match(/韩国/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为韩国</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/印度/) &&
    TORRENT_INFO.descInfo.area.match(/印度/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为印度</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.area.match(/其他/) &&
    TORRENT_INFO.descInfo.area.match(/泰国/)
  ) {
    checkResultBox.innerHTML += '<span>必有 3：地区一致，为印度</span><br>';
  } else if (TORRENT_INFO.descInfo.area != '') {
    checkResultBox.innerHTML += `<span style="color: red">必有 3：地区不一致，应为 ${TORRENT_INFO.descInfo.area}</span><br>`;
  } else {
    checkResultBox.innerHTML += '<span style="color: orange">必有 3：地区未判断</span><br>';
  }
  //判断：显著错误
  if (
    TORRENT_INFO.titleInfo.origin
      .replace(TORRENT_INFO.titleInfo.group, '')
      .match(/(BDRip|BDMV|[^\x00-\xff])/i)
  ) {
    console.log(
      TORRENT_INFO.titleInfo.origin
        .replace(TORRENT_INFO.titleInfo.group, '')
        .match(/(BDRip|BDMV|[^\x00-\xff])/i)
    );
    checkResultBox.innerHTML +=
      '<span style="color: red">如有：命名规范（BDRip、BDMV、特殊字符）</span><br>';
  } else if (TORRENT_INFO.results.title.match(/\./)) {
    checkResultBox.innerHTML +=
      '<span style="color: red">如有：标题中有多余的点需要删除</span><br>';
  } else if (TORRENT_INFO.results.title.match(/2.05.1/)) {
    checkResultBox.innerHTML += '<span style="color: red">如有：音频通道错误</span><br>';
  } else if (
    TORRENT_INFO.titleInfo.format == 'TrueHD' &&
    TORRENT_INFO.titleInfo.channels != '7.1' &&
    TORRENT_INFO.titleInfo.aobject == 'Atmos'
  ) {
    checkResultBox.innerHTML += '<span style="color: red">如有：音频对象错误</span><br>';
  }
  //判断：mediaInfo 检查
  if (TORRENT_INFO.mediaInfo.full == '' && TORRENT_INFO.bdInfo.full == '') {
    //mediaInfo、bdInfo 都为空
    correctTitle = correctTitle.replace('##Resolution##', TORRENT_INFO.titleInfo.resolution);
    correctTitle = correctTitle.replace('##Vcodec##', TORRENT_INFO.titleInfo.vcodec);
    correctTitle = correctTitle.replace('##Acodec##', TORRENT_INFO.titleInfo.acodec);
    correctTitle = correctTitle.replace('##Channels##', TORRENT_INFO.titleInfo.channels);
    correctTitle = correctTitle.replace('##Atmos##', TORRENT_INFO.titleInfo.aobject);
    correctTitle = correctTitle.replace('##Group##', TORRENT_INFO.titleInfo.group);
    correctTitle = '<br><span style="color: red">缺少 mediaInfo 或 bdInfo</span>';
  } else if (TORRENT_INFO.mediaInfo.full != '') {
    //判断：分辨率
    if (TORRENT_INFO.titleInfo.resolution == TORRENT_INFO.results.resolution) {
      correctTitle = correctTitle.replace(
        '##Resolution##',
        `<span style="color: #00FF00">${TORRENT_INFO.results.resolution}</span>`
      );
    } else if (TORRENT_INFO.results.resolution == '') {
      correctTitle = correctTitle.replace(
        '##Resolution##',
        `<span style="color: orange">${TORRENT_INFO.titleInfo.resolution}</span>`
      );
    } else {
      correctTitle = correctTitle.replace(
        '##Resolution##',
        `<span style="color: red">${TORRENT_INFO.results.resolution}</span>`
      );
    }
    //判断：视频编码
    if (TORRENT_INFO.titleInfo.vcodec == TORRENT_INFO.results.vcodec) {
      correctTitle = correctTitle.replace(
        '##Vcodec##',
        `<span style="color: #00FF00">${TORRENT_INFO.results.vcodec}</span>`
      );
    } else if (TORRENT_INFO.titleInfo.vcodec.match(/(H.?264|H.?265)/i)) {
      match = TORRENT_INFO.titleInfo.vcodec.match(/(H.?264|H.?265)/i)[0];
      if (match.replace('.', '') == TORRENT_INFO.results.vcodec) {
        correctTitle = correctTitle.replace(
          '##Vcodec##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.vcodec}</span>`
        );
      } else if (match.replace(' ', '') == TORRENT_INFO.results.vcodec) {
        correctTitle = correctTitle.replace(
          '##Vcodec##',
          `<span style="color: red">${TORRENT_INFO.results.vcodec}</span>`
        );
      } else if (TORRENT_INFO.results.vcodec == '') {
        correctTitle = correctTitle.replace(
          '##Vcodec##',
          `<span style="color: orange">${TORRENT_INFO.titleInfo.vcodec}</span>`
        );
      } else {
        correctTitle = correctTitle.replace(
          '##Vcodec##',
          `<span style="color: red">${TORRENT_INFO.results.vcodec}</span>`
        );
      }
    } else if (TORRENT_INFO.results.vcodec == 'MPEG-2') {
      if (TORRENT_INFO.titleInfo.vcodec.match(/MPEG-?2/i)) {
        correctTitle = correctTitle.replace(
          '##Vcodec##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.vcodec}</span>`
        );
      } else {
        correctTitle = correctTitle.replace(
          '##Vcodec##',
          `<span style="color: red">${TORRENT_INFO.results.vcodec}</span>`
        );
      }
    } else if (TORRENT_INFO.results.zhiliang == '' || TORRENT_INFO.mediaInfo.video.format == '') {
      correctTitle = correctTitle.replace(
        '##Vcodec##',
        `<span style="color: orange">${TORRENT_INFO.titleInfo.vcodec}</span>`
      );
    } else {
      correctTitle = correctTitle.replace(
        '##Vcodec##',
        `<span style="color: red">${TORRENT_INFO.results.vcodec}</span>`
      );
    }
    //判断：音频编码
    if (Object.keys(TORRENT_INFO.mediaInfo.audios).length == 1) {
      //对象
      if (
        TORRENT_INFO.mediaInfo.audios.audio1.object.match(TORRENT_INFO.titleInfo.aobject) &&
        TORRENT_INFO.titleInfo.aobject != ''
      ) {
        correctTitle = correctTitle.replace(
          '##Atmos##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.aobject}</span>`
        );
      } else if (
        TORRENT_INFO.mediaInfo.audios.audio1.object == 'Atmos' &&
        TORRENT_INFO.titleInfo.aobject == ''
      ) {
        correctTitle = correctTitle
          .replace('##Acodec##', '##Acodec## ##Atmos## ')
          .replace('##Atmos##', '<span style="color: red">Atmos</span>');
      } else {
        correctTitle = correctTitle.replace('##Atmos##', TORRENT_INFO.titleInfo.aobject);
      }
      //编码
      if (
        TORRENT_INFO.mediaInfo.audios.audio1.format ==
        TORRENT_INFO.titleInfo.acodec.replace('EAC3', 'DDP').replace('DD+', 'DDP')
      ) {
        correctTitle = correctTitle.replace(
          '##Acodec##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.acodec}</span>`
        );
      } else if (
        TORRENT_INFO.mediaInfo.audios.audio1.format ==
        TORRENT_INFO.titleInfo.acodec.replace(/AC-?3/i, 'DD')
      ) {
        correctTitle = correctTitle.replace(
          '##Acodec##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.acodec}</span>`
        );
      } else if (TORRENT_INFO.mediaInfo.audios.audio1.format != '') {
        correctTitle = correctTitle.replace(
          '##Acodec##',
          `<span style="color: red">${TORRENT_INFO.mediaInfo.audios.audio1.format}</span>`
        );
      } else {
        correctTitle = correctTitle.replace('##Acodec##', TORRENT_INFO.titleInfo.acodec);
      }
      //通道
      if (TORRENT_INFO.mediaInfo.audios.audio1.channels == TORRENT_INFO.titleInfo.channels) {
        correctTitle = correctTitle.replace(
          '##Channels##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.channels}</span>`
        );
      } else if (TORRENT_INFO.titleInfo.channels != '') {
        correctTitle = correctTitle.replace(
          '##Channels##',
          `<span style="color: red">${TORRENT_INFO.mediaInfo.audios.audio1.channels}</span>`
        );
      }
    } else {
      console.log(Object.keys(TORRENT_INFO.mediaInfo.audios).length);
      correctTitle = correctTitle.replace('##Acodec##', TORRENT_INFO.titleInfo.acodec);
      correctTitle = correctTitle.replace('##Channels##', TORRENT_INFO.titleInfo.channels);
      correctTitle = correctTitle.replace('##Atmos##', TORRENT_INFO.titleInfo.aobject);
    }
    correctTitle = correctTitle.replace('##Group##', TORRENT_INFO.titleInfo.group);

    correctTitle = correctTitle + TORRENT_INFO.titleInfo.freeinfo;
  } else if (TORRENT_INFO.bdInfo.full != '') {
    //判断：分辨率
    if (TORRENT_INFO.titleInfo.resolution == TORRENT_INFO.results.resolution) {
      correctTitle = correctTitle.replace(
        '##Resolution##',
        `<span style="color: #00FF00">${TORRENT_INFO.results.resolution}</span>`
      );
    } else {
      correctTitle = correctTitle.replace(
        '##Resolution##',
        `<span style="color: red">${TORRENT_INFO.results.resolution}</span>`
      );
    }
    //判断：视频编码
    if (TORRENT_INFO.titleInfo.vcodec == TORRENT_INFO.results.vcodec) {
      correctTitle = correctTitle.replace(
        '##Vcodec##',
        `<span style="color: #00FF00">${TORRENT_INFO.results.vcodec}</span>`
      );
    } else {
      correctTitle = correctTitle.replace(
        '##Vcodec##',
        `<span style="color: red">${TORRENT_INFO.results.vcodec}</span>`
      );
    }
    //判断：音频编码
    console.log(Object.keys(TORRENT_INFO.bdInfo.audios).length);
    if (Object.keys(TORRENT_INFO.bdInfo.audios).length == 1) {
      if (
        TORRENT_INFO.bdInfo.audios.audio1.object.match(TORRENT_INFO.titleInfo.aobject) &&
        TORRENT_INFO.titleInfo.aobject != ''
      ) {
        correctTitle = correctTitle.replace(
          '##Atmos##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.aobject}</span>`
        );
      } else if (
        TORRENT_INFO.bdInfo.audios.audio1.object.match(TORRENT_INFO.titleInfo.aobject) &&
        TORRENT_INFO.titleInfo.aobject == ''
      ) {
        correctTitle = correctTitle
          .replace('##Acodec##', '##Acodec## ##Atmos##')
          .replace(
            '##Atmos##',
            `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.aobject}</span>`
          );
      } else {
        correctTitle = correctTitle.replace('##Atmos##', TORRENT_INFO.titleInfo.aobject);
      }
      if (
        TORRENT_INFO.bdInfo.audios.audio1.format ==
        TORRENT_INFO.titleInfo.acodec.replace('EAC3', 'DDP').replace('DD+', 'DDP')
      ) {
        correctTitle = correctTitle.replace(
          '##Acodec##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.acodec}</span>`
        );
      } else if (
        TORRENT_INFO.bdInfo.audios.audio1.format ==
        TORRENT_INFO.titleInfo.acodec.replace('AC3', 'DD')
      ) {
        correctTitle = correctTitle.replace(
          '##Acodec##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.acodec}</span>`
        );
      } else if (TORRENT_INFO.bdInfo.audios.audio1.format != '') {
        correctTitle = correctTitle.replace(
          '##Acodec##',
          `<span style="color: red">${TORRENT_INFO.bdInfo.audios.audio1.format}</span>`
        );
      } else {
        correctTitle = correctTitle.replace('##Acodec##', TORRENT_INFO.titleInfo.acodec);
      }
      if (TORRENT_INFO.bdInfo.audios.audio1.channels == TORRENT_INFO.titleInfo.channels) {
        correctTitle = correctTitle.replace(
          '##Channels##',
          `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.channels}</span>`
        );
      } else if (TORRENT_INFO.titleInfo.channels != '') {
        correctTitle = correctTitle.replace(
          '##Channels##',
          `<span style="color: red">${TORRENT_INFO.bdInfo.audios.audio1.channels}</span>`
        );
      }
    } else {
      correctTitle = correctTitle.replace('##Acodec##', TORRENT_INFO.titleInfo.acodec);
      correctTitle = correctTitle.replace('##Channels##', TORRENT_INFO.titleInfo.channels);
      correctTitle = correctTitle.replace('##Atmos##', TORRENT_INFO.titleInfo.aobject);
    }
    correctTitle = correctTitle.replace('##Group##', TORRENT_INFO.titleInfo.group);

    correctTitle = correctTitle + TORRENT_INFO.titleInfo.freeinfo;
  }
  //判断 DVD 制式
  if (
    TORRENT_INFO.mediaInfo.standard == TORRENT_INFO.titleInfo.standard &&
    TORRENT_INFO.mediaInfo.standard != ''
  ) {
    correctTitle = correctTitle.replace(
      '##Standard##',
      `<span style="color: #00FF00">${TORRENT_INFO.mediaInfo.standard}</span>`
    );
  } else {
    correctTitle = correctTitle.replace(
      '##Standard##',
      `<span style="color: red">${TORRENT_INFO.mediaInfo.standard}</span>`
    );
  }
  //判断：标题片名
  match = TORRENT_INFO.descInfo.moviename
    .replace(/\+/g, '@@')
    .toLowerCase()
    .match(TORRENT_INFO.titleInfo.name.replace(/\+/g, '@@').toLowerCase());
  if (match && TORRENT_INFO.titleInfo.name.toLowerCase() != '') {
    correctTitle = correctTitle.replace(
      '##Name##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.name}</span>`
    );
  } else if (TORRENT_INFO.titleInfo.name.toLowerCase() != '') {
    correctTitle = correctTitle.replace(
      '##Name##',
      `<span style="color: orange">${TORRENT_INFO.titleInfo.name}</span>`
    );
  } else {
    correctTitle = correctTitle.replace('##Name##', '');
    checkResultBox.innerHTML += '<span style="color: red">如有：主标题不符合命名规范</span><br>';
  }
  //判断：标题年份
  if (TORRENT_INFO.results.category == '电影' && TORRENT_INFO.titleInfo.year == '') {
    checkResultBox.innerHTML += '<span style="color: red">如有：标题缺少年份</span><br>';
  } else if (
    TORRENT_INFO.titleInfo.year == TORRENT_INFO.descInfo.publishdate &&
    TORRENT_INFO.descInfo.publishdate != ''
  ) {
    correctTitle = correctTitle.replace(
      '##Year##',
      `<span style="color: #00FF00">${TORRENT_INFO.descInfo.publishdate}</span>`
    );
  } else if (TORRENT_INFO.descInfo.publishdate == '') {
    correctTitle = correctTitle.replace(
      '##Year##',
      `<span style="color: orange">${TORRENT_INFO.titleInfo.year}</span>`
    );
  } else {
    correctTitle = correctTitle.replace(
      '##Year##',
      `<span style="color: red">${TORRENT_INFO.descInfo.publishdate}</span>`
    );
  }
  //判断：标题季数
  if (TORRENT_INFO.titleInfo.season == TORRENT_INFO.results.season) {
    correctTitle = correctTitle.replace(
      '##Season##',
      `<span style="color: #00FF00">${TORRENT_INFO.results.season}</span>`
    );
  } else {
    correctTitle = correctTitle.replace(
      '##Season##',
      `<span style="color: red">${TORRENT_INFO.results.season}</span>`
    );
  }
  //判断：年份季数至少含一个
  if (TORRENT_INFO.titleInfo.year == '' && TORRENT_INFO.titleInfo.season == '') {
    checkResultBox.innerHTML += '<span style="color: red">如有：主标题不符合命名规范</span><br>';
  }
  //判断：标题集数
  if (TORRENT_INFO.tableInfo.chapter1 == '-1' && TORRENT_INFO.tableInfo.chapter2 != '') {
    if (
      parseInt(TORRENT_INFO.titleInfo.chapter1) == parseInt(TORRENT_INFO.tableInfo.chapter1) &&
      parseInt(TORRENT_INFO.titleInfo.chapter2) == parseInt(TORRENT_INFO.tableInfo.chapter2)
    ) {
      correctTitle = correctTitle.replace(
        '##Chapters##',
        `<span style="color: #00FF00">E${TORRENT_INFO.titleInfo.chapter2}</span>`
      );
    } else {
      correctTitle = correctTitle.replace(
        '##Chapters##',
        `<span style="color: red">E${TORRENT_INFO.results.chapter2}</span>`
      );
    }
  } else if (TORRENT_INFO.tableInfo.chapter1 != '-1' && TORRENT_INFO.tableInfo.chapter1 != '') {
    if (
      parseInt(TORRENT_INFO.titleInfo.chapter1) == parseInt(TORRENT_INFO.tableInfo.chapter1) &&
      parseInt(TORRENT_INFO.titleInfo.chapter2) == parseInt(TORRENT_INFO.tableInfo.chapter2)
    ) {
      correctTitle = correctTitle.replace(
        '##Chapters##',
        `<span style="color: #00FF00">E${TORRENT_INFO.titleInfo.chapter1}-E${TORRENT_INFO.titleInfo.chapter2}</span>`
      );
    } else {
      correctTitle = correctTitle.replace(
        '##Chapters##',
        `<span style="color: red">E${TORRENT_INFO.results.chapter1}-E${TORRENT_INFO.results.chapter2}</span>`
      );
    }
  } else {
    correctTitle = correctTitle.replace('##Chapters##', '');
  }
  //判断：标题媒介
  if (TORRENT_INFO.results.zhiliang == TORRENT_INFO.results.source) {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.source}</span>`
    );
  } else if (TORRENT_INFO.results.zhiliang == 'Encode' && TORRENT_INFO.results.source == 'DVDRip') {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.source}</span>`
    );
  } else if (
    (TORRENT_INFO.results.zhiliang == 'BD' ||
      TORRENT_INFO.results.zhiliang == 'UHD' ||
      TORRENT_INFO.results.zhiliang == 'REMUX' ||
      TORRENT_INFO.results.zhiliang == 'Encode') &&
    TORRENT_INFO.results.source == 'Blu-ray'
  ) {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.source}</span>`
    );
  } else if (
    TORRENT_INFO.results.zhiliang == 'Encode' &&
    TORRENT_INFO.results.source == 'HDTVRip'
  ) {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.source}</span>`
    );
  } else if (TORRENT_INFO.results.zhiliang == 'Encode' && TORRENT_INFO.results.source == 'WEBRip') {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.source}</span>`
    );
  } else if (
    TORRENT_INFO.results.zhiliang == 'Encode' &&
    TORRENT_INFO.results.source == 'WEB-DL' &&
    TORRENT_INFO.titleInfo.group.match(/FRDS/)
  ) {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.source}</span>`
    );
  } else if (TORRENT_INFO.results.zhiliang == '') {
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: orange">${TORRENT_INFO.results.source}</span>`
    );
  } else {
    console.log(TORRENT_INFO.titleInfo.group.match(/FRDS/));
    correctTitle = correctTitle.replace(
      '##Source##',
      `<span style="color: red">${TORRENT_INFO.results.source}</span>`
    );
  }
  //判断：标题 REMUX
  if (TORRENT_INFO.results.source == 'Blu-ray' && TORRENT_INFO.results.zhiliang == 'REMUX') {
    correctTitle = correctTitle.replace('##REMUX##', '<span style="color: #00FF00">REMUX</span>');
  } else {
    correctTitle = correctTitle.replace('##REMUX##', 'REMUX');
  }
  //判断：标题 FPS
  match = TORRENT_INFO.titleInfo.fps.toLowerCase();
  if (TORRENT_INFO.mediaInfo.video.fps.toLowerCase() == match) {
    correctTitle = correctTitle.replace(
      '##FPS##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.fps}</span>`
    );
  } else {
    correctTitle = correctTitle.replace(
      '##FPS##',
      `<span style="color: red">${TORRENT_INFO.mediaInfo.video.fps}</span>`
    );
  }
  //判断：HDR
  if (TORRENT_INFO.titleInfo.hdr != '') {
    if (
      TORRENT_INFO.results.hdr.match(
        TORRENT_INFO.titleInfo.hdr.replace('HDR10', 'HDR').replace('P', '+')
      )
    ) {
      correctTitle = correctTitle.replace(
        '##HDR##',
        `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.hdr}</span>`
      );
    } else if (TORRENT_INFO.results.hdr != 'Unknown') {
      correctTitle = correctTitle.replace(
        '##HDR##',
        `<span style="color: red">${TORRENT_INFO.results.hdr}</span>`
      );
    } else if (TORRENT_INFO.results.hdr == 'Unknown') {
      correctTitle = correctTitle.replace(
        '##HDR##',
        `<span style="color: orange">${TORRENT_INFO.titleInfo.hdr}</span>`
      );
    } else {
      correctTitle = correctTitle.replace('##HDR##', '');
    }
  }
  correctTitle = correctTitle.replace('##HDR##', '??');
  //判断：DV
  if (
    (TORRENT_INFO.mediaInfo.video.dv == true || TORRENT_INFO.bdInfo.video.dv == true) &&
    TORRENT_INFO.titleInfo.dv != ''
  ) {
    correctTitle = correctTitle.replace(
      '##DoVi##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.dv}</span>`
    );
  } else if (
    (TORRENT_INFO.mediaInfo.video.dv == false || TORRENT_INFO.bdInfo.video.dv == false) &&
    TORRENT_INFO.titleInfo.dv != ''
  ) {
    correctTitle = correctTitle.replace('##DoVi##', '');
  }
  correctTitle = correctTitle.replace('##DoVi##', '??');
  //判断：10 Bits
  if (
    TORRENT_INFO.titleInfo.bitdepth.match(TORRENT_INFO.mediaInfo.video.bitdepth) &&
    TORRENT_INFO.mediaInfo.video.bitdepth != ''
  ) {
    correctTitle = correctTitle.replace(
      '##BitDepth##',
      `<span style="color: #00FF00">${TORRENT_INFO.titleInfo.bitdepth}</span>`
    );
  } else if (TORRENT_INFO.mediaInfo.video.bitdepth == '') {
    correctTitle = correctTitle.replace(
      '##BitDepth##',
      `<span style="color: orange">${TORRENT_INFO.titleInfo.bitdepth}</span>`
    );
  }
  if (
    TORRENT_INFO.mediaInfo.hasCantonese == false &&
    TORRENT_INFO.tableInfo.hasTagCantonese == true
  ) {
    checkResultBox.innerHTML += '<span style="color: red" id="Cantonese_N">没有 粤语</span><br>';
  } else if (
    TORRENT_INFO.mediaInfo.hasCantonese == true &&
    TORRENT_INFO.tableInfo.hasTagCantonese == false
  ) {
    checkResultBox.innerHTML +=
      '<span style="color: red" id="Cantonese_Y">缺少 粤语 标签</span><br>';
  }
  if (
    TORRENT_INFO.mediaInfo.hasMandarin == false &&
    TORRENT_INFO.tableInfo.hasTagMandarin == true
  ) {
    checkResultBox.innerHTML += '<span style="color: red">没有 国语</span><br>';
  } else if (
    TORRENT_INFO.mediaInfo.hasMandarin == true &&
    TORRENT_INFO.tableInfo.hasTagMandarin == false
  ) {
    checkResultBox.innerHTML += '<span style="color: red">缺少 国语 标签</span><br>';
  }
  //判断：字幕标签
  if (
    Object.keys(TORRENT_INFO.mediaInfo.subtitles).length == 0 &&
    TORRENT_INFO.bdInfo.subtitles.length == 0 &&
    TORRENT_INFO.tableInfo.hasTagChineseSubtitles == false &&
    TORRENT_INFO.tableInfo.hasTagEnglishSubtitles == false
  ) {
    //没有考虑解析 Info 获取到了字幕的情况（length = 0）
    checkResultBox.innerHTML += '<span style="color: red">检查是否有字幕</span><br>';
  } else {
    if (TORRENT_INFO.results.zhiliang != 'BD' && TORRENT_INFO.results.zhiliang != 'UHD') {
      if (
        (TORRENT_INFO.tableInfo.area.match(/(大陆|台湾|香港)/) ||
          TORRENT_INFO.mediaInfo.hasChineseSubtitles == true) &&
        TORRENT_INFO.tableInfo.hasTagChineseSubtitles == false
      ) {
        checkResultBox.innerHTML += '<span style="color: red">缺少 中字 标签</span><br>';
      } else if (
        !TORRENT_INFO.descInfo.area.match(/(大陆|台湾|香港)/) &&
        TORRENT_INFO.mediaInfo.hasChineseSubtitles == false &&
        TORRENT_INFO.tableInfo.hasTagChineseSubtitles == true
      ) {
        checkResultBox.innerHTML += '<span style="color: orange">检查是否有硬中字字幕</span><br>';
      }
    } else {
      if (
        (TORRENT_INFO.mediaInfo.hasChineseSubtitles == true ||
          TORRENT_INFO.tableInfo.subtitle.match(/内嵌中字|硬中字/)) &&
        TORRENT_INFO.tableInfo.hasTagChineseSubtitles == false
      ) {
        checkResultBox.innerHTML += '<span style="color: red">缺少 中字 标签</span><br>';
      } else if (
        TORRENT_INFO.mediaInfo.hasChineseSubtitles == false &&
        TORRENT_INFO.tableInfo.hasTagChineseSubtitles == true
      ) {
        checkResultBox.innerHTML += '<span style="color: red">没有 中字</span><br>';
      }
    }
    console.log(!TORRENT_INFO.descInfo.area.match(/(大陆|台湾|香港)/));
    if (
      TORRENT_INFO.mediaInfo.hasEnglishSubtitles == false &&
      TORRENT_INFO.tableInfo.hasTagEnglishSubtitles == true
    ) {
      checkResultBox.innerHTML += '<span style="color: orange">检查是否有硬英字字幕</span><br>';
    }
  }
  if (TORRENT_INFO.bdInfo.DIY == true && TORRENT_INFO.tableInfo.hasTagDIY == false) {
    checkResultBox.innerHTML += '<span style="color: red" id="DIY_Y">缺少 DIY 标签</span><br>';
  } else if (TORRENT_INFO.bdInfo.DIY == false && TORRENT_INFO.tableInfo.hasTagDIY == true) {
    checkResultBox.innerHTML += '<span style="color: red" id="DIY_N">非 DIY 原盘</span><br>';
  }
  //判断：IMDb 链接
  if (
    TORRENT_INFO.tableInfo.imdburl == '' &&
    !TORRENT_INFO.descInfo.area.match(/(大陆|台湾|香港)/)
  ) {
    checkResultBox.innerHTML += '<br><span style="color: red">IMDb 链接为空</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.imdburl != TORRENT_INFO.descInfo.imdburl &&
    TORRENT_INFO.descInfo.imdburl != ''
  ) {
    checkResultBox.innerHTML += '<br><span style="color: red">IMDb 链接不一致</span><br>';
  }
  //判断：豆瓣链接
  if (TORRENT_INFO.tableInfo.doubanurl == '') {
    checkResultBox.innerHTML += '<br><span style="color: red">豆瓣链接为空</span><br>';
  } else if (
    TORRENT_INFO.tableInfo.doubanurl != TORRENT_INFO.descInfo.doubanurl &&
    TORRENT_INFO.descInfo.doubanurl != ''
  ) {
    checkResultBox.innerHTML += '<br><span style="color: red">豆瓣链接不一致</span><br>';
  }
  //判断：文件
  if (!TORRENT_INFO.results.zhiliang.match(/(BD|UHD|DVD)/i)) {
    if (TORRENT_INFO.results.chapter2 != '' && TORRENT_INFO.results.chapter1 != '') {
      if (TORRENT_INFO.results.chapter1 != '-1') {
        if (
          TORRENT_INFO.results.files !=
          parseInt(TORRENT_INFO.results.chapter2) - parseInt(TORRENT_INFO.results.chapter1) + 1
        ) {
          table.rows[4].cells[1].innerHTML +=
            '<font size="3"><b><span style="color: red">错误的数量</font></b></font>';
          checkResultBox.innerHTML += '<br><span style="color: red">错误的文件数量</span><br>';
          console.log('第一种错误的文件数量');
        }
      } else {
        if (
          (TORRENT_INFO.tableInfo.chapter2 == '' &&
            TORRENT_INFO.results.files != parseInt(TORRENT_INFO.descInfo.chapters)) ||
          (TORRENT_INFO.tableInfo.chapter2 != '' && TORRENT_INFO.results.files != 1)
        ) {
          table.rows[4].cells[1].innerHTML +=
            '<font size="3"><b><span style="color: red">错误的数量</font></b></font>';
          checkResultBox.innerHTML += '<br><span style="color: red">错误的文件数量</span><br>';
        }
      }
    } else if (
      TORRENT_INFO.results.chapter1 == '' &&
      TORRENT_INFO.results.files != parseInt(TORRENT_INFO.results.chapter2)
    ) {
      table.rows[4].cells[1].innerHTML +=
        '<font size="3"><b><span style="color: red">错误的数量</font></b></font>';
      checkResultBox.innerHTML += '<br><span style="color: red">错误的文件数量</span><br>';
    }
  }
  if (fileTypes != '') {
    checkResultBox.innerHTML += `<span style="color: red">如有：包含多余文件（${fileTypes[0]}）</span>`;
    table.rows[4].cells[1].innerHTML += `<font size="3"><b><span style="color: red">包含多余文件（${fileTypes[0]}）</font></b></font>`;
  }
  //判断：重复
  table = document.getElementById('kothercopy').firstChild;
  if (table.tagName == 'TABLE') {
    let season = false;
    for (let i = 1; i < table.rows.length; i++) {
      if (
        table.rows[i].cells[2].textContent == TORRENT_INFO.tableInfo.size &&
        table.rows[i].cells[1].textContent.match(TORRENT_INFO.titleInfo.group)
      ) {
        table.rows[i].bgColor = '#FFC6B0';
        table.parentNode.parentNode.firstChild.innerHTML +=
          '<span style="color: red">重复！</span>';
      } else if (table.rows[i].cells[2].textContent == TORRENT_INFO.tableInfo.size) {
        table.rows[i].bgColor = '#FFFABE';
        table.parentNode.parentNode.firstChild.innerHTML +=
          '<span style="color: red">可能重复！</span>';
      }
      if (TORRENT_INFO.results.season != '' && TORRENT_INFO.results.season != 'S01' && !season) {
        if (table.rows[i].cells[1].textContent.match('S01')) {
          table.rows[i].bgColor = '#FFFABE';
          table.parentNode.parentNode.firstChild.innerHTML +=
            '<span style="color: red">此种不为第一季但其他列表出现第一季！</span>';
          season = true;
        }
      }
    }
  }
  //判断：bdInfo 码率
  if (TORRENT_INFO.bdInfo.video.bitrates.replace('kbps', '').trim() == '0') {
    checkResultBox.innerHTML += '<br><span style="color: red">bdInfo 码率为 0</span><br>';
  }
  //判断：连续多个空格
  if (TORRENT_INFO.titleInfo.origin.match(/\s{2,}/g)) {
    checkResultBox.innerHTML += '<br><span>主标题含连续多个空格</span><br>';
  }

  h1.innerHTML += correctTitle;
  document.body.appendChild(checkResultBox);
  console.log('checked');
})();
