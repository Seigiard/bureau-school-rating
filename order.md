# Как поменять порядок недель в кабинете

Поставьте Стайлиш

* для [Хрома, Оперы или Яндекс.Браузера](https://chrome.google.com/webstore/detail/stylish-custom-themes-for/fjnbnpbmkenffdnngjfgmeleoegfcffe?hl=en-US)
* [Сафари](https://safari-extensions.apple.com/details/?id=com.sobolev.stylish-5555L95H45)
* или [Файрфокса](https://addons.mozilla.org/en-US/firefox/addon/stylish/).

Создайте новое правило и впишите туда стиль:

    body .classroom .pageTitle + div {
        flex-direction: column-reverse;
        display: flex;
    }

    body .classroom .curriculumWeek {
        margin: 54px 0 0 0;
    }

Выберите настройку

    Applies to URLs starting with: «http://bureau.ru/school/classroom»

Сохраните. Наслаждайтесь.
