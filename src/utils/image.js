export function generateNumberImage(number) {
    let text;
    if (number < 10)
        text = '0' + number;
    else if (number >= 100)
        text = '99';
    else
        text = number;
    let c = document.createElement("canvas");
    let ctx = c.getContext("2d");
    ctx.font = "140px 微软雅黑";
    ctx.fillText(text, 80, 125);
    return c.toDataURL();
}