# Image Manager (backend)

[Ссылка на развёрнутый сайт](https://ahj-http-image-manager-server.herokuapp.com/).

[Ссылка на исходный код frontend](https://github.com/LiquidAssContainer/ahj_http_image-manager).

Функционал рабочий, хотя код очень «новичковый», само собой. Предполагаю, что я не совсем правильно использовал Koa Router, т. к. возникли некоторые проблемы с запросом, содержащим файл. В итоге пришлось часть обработки оставить в `router`, а обработку POST-запроса с изображением обрабатывать всё же в `app.use(...)`.

Порядок изображений идёт по названию файла, а не по дате добавления.
