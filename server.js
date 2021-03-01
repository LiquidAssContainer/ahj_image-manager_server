const http = require('http');
const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const koaBody = require('koa-body');
const uuid = require('uuid');
const serve = require('koa-static');
const Router = require('@koa/router');

const app = new Koa();
const router = new Router();

const publicDirPath = path.join(__dirname, '/public');
const imagesDirPath = path.join(publicDirPath, '/images');

// скопировано из репозитория Нетологии без изменений
app.use(async (ctx, next) => {
  const origin = ctx.request.get('Origin');
  if (!origin) {
    return await next();
  }

  const headers = { 'Access-Control-Allow-Origin': '*' }; // пусть так и будет

  if (ctx.request.method !== 'OPTIONS') {
    ctx.response.set({ ...headers });
    try {
      return await next();
    } catch (e) {
      e.headers = { ...e.headers, ...headers };
      throw e;
    }
  }

  if (ctx.request.get('Access-Control-Request-Method')) {
    ctx.response.set({
      ...headers,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, PATCH',
    });

    if (ctx.request.get('Access-Control-Request-Headers')) {
      ctx.response.set('Access-Control-Allow-Headers', ctx.request.get('Access-Control-Request-Headers'));
    }

    ctx.response.status = 204;
  }
});

app.use(
  koaBody({
    text: true,
    urlencoded: true,
    multipart: true,
    json: true,
  })
);

router.get('/images', async (ctx, next) => {
  const { method } = ctx.query;
  if (method === 'getLinks') {
    const imgLinks = [];
    filenames = fs.readdirSync(imagesDirPath);
    for (const file of filenames) {
      if (/\.(jpe?g|png|gif)$/.test(file)) {
        imgLinks.push(file);
      }
    }
    ctx.body = imgLinks;
  }
  return await next();
});

router.del('/images', async (ctx, next) => {
  const { filename } = ctx.query;
  const filePath = `${imagesDirPath}/${filename}`;
  try {
    await fs.unlinkSync(filePath);
    ctx.body = { success: true, message: 'Изображение успешно удалено' };
  } catch (e) {
    ctx.body = { success: false, message: 'Не получилось удалить изображение' };
  }
  return await next();
});

app.use(router.routes()).use(router.allowedMethods());

app.use(serve(publicDirPath));

app.use(async (ctx) => {
  if (ctx.request.method !== 'POST') {
    return;
  }

  const { file } = ctx.request.files;
  const { type } = file;

  // мб костыльно
  if (!/^image\//.test(type)) {
    ctx.response.body = { success: false, message: 'Файл не является изображением' };
    return;
  }

  // скопировано почти без изменений
  const link = await new Promise((resolve, reject) => {
    const fileExtension = type.split('image/')[1];
    const oldPath = file.path;
    const filename = uuid.v4() + '.' + fileExtension;
    const newPath = path.join(imagesDirPath, filename);

    const callback = (error) => reject(error);

    const readStream = fs.createReadStream(oldPath);
    const writeStream = fs.createWriteStream(newPath);

    readStream.on('error', callback);
    writeStream.on('error', callback);

    readStream.on('close', () => {
      console.log('close');
      fs.unlink(oldPath, callback);
      resolve(filename);
    });

    readStream.pipe(writeStream);
  });

  ctx.response.body = link;
  return;
});

const port = process.env.PORT || 7070;
http.createServer(app.callback()).listen(port);
