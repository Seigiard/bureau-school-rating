# Как поменять порядок недель в кабинете

Поставьте Стайлиш:
https://chrome.google.com/webstore/detail/stylish-custom-themes-for/fjnbnpbmkenffdnngjfgmeleoegfcffe?hl=en-US

Создайте новое правило и впишите туда стиль:

    body .webpage {
        flex-direction: column-reverse;
        display: flex;
    }

    body .curriculumWeek {
        margin: 54px 0 0 0;
    }

    body .pageTitle {
        order: 1;
    }
    body .product {
        order: 2;
    }

Applies to URLs starting with: «http://bureau.ru/school/classroom»
