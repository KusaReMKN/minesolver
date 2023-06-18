'use strict';

async function
fetchIconChip(url)
{
	const img = await new Promise((res, rej) => {
		const img = new Image();
		img.addEventListener('load', _ => res(img));
		img.addEventListener('error', e => rej(e));
		img.src = url;
	});
	const cv = new OffscreenCanvas(img.width, img.height);
	const ctx = cv.getContext('2d');
	ctx.drawImage(img, 0, 0);
	const res = [];
	for (let i = 0; i < cv.height; i += cv.width)
		res.push(ctx.getImageData(0, i, cv.width, cv.height));
	return res;
}

function
imageData2ImageBitmap(imageData)
{
	const cv = new OffscreenCanvas(imageData.width, imageData.height);
	const ctx = cv.getContext('2d');
	ctx.putImageData(imageData, 0, 0);
	return cv.transferToImageBitmap();
}

let chips, chipTab, cellSize;
window.addEventListener('load', async _ => {
	const iconChipUrl = 'data:image/webp;base64,UklGRgYCAABXRUJQVlA4TPoBAAAvH8BfEG9gIJKMVUUFWZSkkypqGGQbqU7H8g/5B/kG2UbqMR3Ls7ztq/z8B6DnwYtGw5LWzdkOx6BSgFvbtpvo4b2nAlXAzFTgCvA5ETEZKSEtjJ9YkXK1ACVQzEj/3fv+x2iRRfSfgdpIQjrIsHrccrOif5BTUdxmVxyTKzh/FJHzgyUnnHzsiGMoCkPLlauGYqUFYLYExnpQhONRLM1bNbwd0OB9QwMWUlY6Z4+DF4Qe31zVFG9aAGaPwFgPinBsBVlcA/uY4cXhz81z5DnTORjmVCRK07QDSTJS7IzEgbikKfZOBvEM7DnYGR2K+KLVoaRWElLg7cOSdKQwNF8o1V0WQGYMhV5yKMBKykLn4mEsPv++9mLukas5BxBDYWi9cdTUbJS0a4CzAuwJkFDYl/CNgFE25Nxrjb2BpbAuWduDMMypKDQcKZVcRkChCNZgqBmWdA96+pLiaJxRosjBANkViWY3jiqaGyXkyrQzU/vONPYGloIv4Rud/rnpHAxzOueKInYxIkbEiLwRjnCEIxwZnRT6MxrgO6wdGOec/mtK7Fme6RDkrO+Db3YG/G+AmA1z03b7kE8B8TAi3E7Zk9t/g3PNmXrNdTSyvigl8SbAe8Zz5nPgczqJ/9CeaUf5ov6+322hvi4Rvt6Jdu+ML8qW6evy5Z3pHQ==';
	chips = (await fetchIconChip(iconChipUrl)).map(e => imageData2ImageBitmap(e));
	chipTab = {
		'1': chips[0], '2': chips[1], '3': chips[2], '4': chips[3],
		'5': chips[4], '6': chips[5], '7': chips[6], '8': chips[7],
		'F': chips[8], 'X': chips[9], '#': chips[10], '.': chips[11],
	};
	cellSize = chips[0].width;
});

function
noop()
{
	/* Nothing to do */
}

async function
solver_1()
{
	console.time();
	let rerun;
	let prev = m.getMap().map(r => r.map(_ => '#'));
	let area = [];
	let unsolve = [];
	do {
		rerun = false;

		/* まずは新しい数字セルを新人さんとして登録 */
		const map = m.getMap();
		const newbie = [];
		map.forEach((r, i) => r.forEach((e, j) =>
			/[1-8]/.test(e) && prev[i][j] === '#' && newbie.push({ x: j, y: i })
		));
		if (newbie.length === 0)
			break;
		//prev = map;

		/* 新人さんの周囲にある地雷領域を記録 */
		newbie.forEach(e => {
			const s = new Set();
			for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++)
				if (/[#F]/.test(map[e.y + i]?.[e.x + j]))
					s.add(`${e.x+j},${e.y+i}`);
			area.push({ n: +map[e.y][e.x], s });
		});

		/* 地雷領域を整理 */
		area.push({ n: -1, s: null });	/* 番兵 */
		let elem;
		while ((elem = area.shift()).s !== null) {
			const temp = [];
			area.forEach(e => {
				if (e.n === -1) {
					temp.push(e);
					return;
				}
				const has = [...elem.s].reduce(
					(r, k) => e.s.has(k) && r,
					true
				);
				if (has) {
					let k = e;
					const ts = new Set(k.s.values());
					elem.s.forEach(e => ts.delete(e));
					if (ts.size === 0)
						return;
					const nn = k.n - elem.n;
					if (nn !== 1 && (nn === 0 || nn === ts.size)) {
						ts.forEach(e => temp.unshift(
							{ n: Math.sign(nn), s: new Set([e]) }
						));
					} else {
						temp.push({ n: k.n - elem.n, s: ts });
					}
				} else {
					temp.push(e);
				}
			});
			temp.push(elem);
			area = temp;
		}

		area.forEach(e => {
			if (e.n === 1 && e.s.size === 1) {
				const c = { x: -1, y: -1 };
				e.s.forEach(e => e.split(',').map(e => +e).forEach((e, i) =>
					i ? c.y = e : c.x = e
				));
				map[c.y][c.x] !== 'F' && m.flag(c.x, c.y);
			}
			if (e.n === 0) {
				const c = { x: -1, y: -1 };
				e.s.forEach(e => e.split(',').map(e => +e).forEach((e, i) =>
					i ? c.y = e : c.x = e
				));
				m.open(c.x, c.y);
				rerun = true;
			}
		});
		await new Promise(r => setTimeout(r));
		area = area.filter(e => e.n > 0);
		unsolve = area.filter(e => e.s.size !== 1);
	} while (rerun);
	console.timeEnd();
	if (unsolve.length > 0) {
		console.table(unsolve.map(e => [ e.n, [...e.s] ]));
	} else {
		console.log('solved');
	}
}

const solverTab = {
	'noop': noop,
	'open': solver_1,
};
let solverName = 'noop';

function
mouseHandler(e)
{
	const x = e.offsetX / cellSize | 0;
	const y = e.offsetY / cellSize | 0;
	const map = m.getMap();

	m.draw();
	switch (e.button) {
	case 0:	/* left button */
		m.open(x, y);
		break;
	case 1:	/* center button */
		m.auto(x, y);
		break;
	case 2:	/* right button */
		m.flag(x, y);
		break;
	default:
		/* Nothing to do */
	}
	solverTab[solverName]();
}
canvas.addEventListener('mousedown', mouseHandler);
canvas.addEventListener('contextmenu', e => e.preventDefault());

const m = new MineSweeper();
let width, height, mines;

function
renderer(map, _, game)
{
	const ctx = canvas.getContext('2d');
	ctx.imageSmoothingEnabled = false;

	ctx.clearRect(0, 0, width * cellSize, height * cellSize);
	map.forEach((r, y) => r.map((e, x) => {
		const cx = cellSize * x;
		const cy = cellSize * y;

		ctx.drawImage(chipTab[/[#F]/.test(e) ? '#' : '.'], cx, cy);
		if (e === 'F')
			ctx.drawImage(chipTab['F'], cx, cy);
		if (e !== '0')
			ctx.drawImage(chipTab[e], cx, cy);
	}));
	remains.textContent = mines - map.reduce(
		(s, r) => r.reduce((s, e) => e === 'F' ? s+1 : s, s), 0
	);
}
m.render(renderer);

function
newGame()
{
	const diff = minesweeper.difficulty.value.split(';');
	[ width, height ] = diff[0].split(',').map(e => +e);
	mines = +diff[1];

	canvas.width = width * cellSize;
	canvas.height = height * cellSize;
	m.start(width, height, mines);
}
minesweeper.addEventListener('submit', newGame);
minesweeper.addEventListener('submit', e => e.preventDefault());

function
useSolver()
{
	solverName = solver.method.value;
}
solver.addEventListener('submit', useSolver);
solver.addEventListener('submit', e => e.preventDefault());
