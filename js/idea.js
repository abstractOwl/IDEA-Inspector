//
// IDEA Inspector
//   by: AbstractOwl for UCSB CS178
//    (http://www.github.com/abstractOwl)
//
// This code was roughly thrown together, will go back to clean up later.
//
(function () {
	'use strict';

	function createBlock(arr) {
		var	wrap	=	document.createElement('div'),
			block	=	'<div class="byte-block ' + ((arr.length == 6) ? 'sk' : '') + '"' + ((arr.length > 0) ? '' : ' style="visibility: hidden"') + '>';

		if (arr.length === 0) {
		}

		for (var i = 0; i < arr.length; i++) {
			var square = '<div class="byte-square">' + arr[i].toString(16) + '</div>';
			block += square;
		}

		block += '</div>';
		wrap.innerHTML = block;
		return wrap.firstChild;
	}
	function createRound(rName, rBlocks) {
		var	round		=	document.createElement('div'),
			roundName	=	document.createElement('div');

		roundName.className = 'round-name';
		roundName.innerHTML	=	'<h4>' + rName + '</h4>';

		round.className = 'round-block clearfix';
		round.appendChild(roundName);

		for (var i = 0, j = rBlocks.length; i < j; i++) {
			round.appendChild(rBlocks[i]);
		}

		return round;
	}
	function getInputs() {
		var k = [], m = [];
		$('.key-row .input-block').each(function () {
			k.push($(this).val() || 0);
		});
		$('.msg-row .input-block').each(function () {
			m.push($(this).val() || 0);
		});
		return { msg: m, key: k };
	}

	function add(a, b) {
		return (a + b) % Math.pow(2, 16);
	}
	function multiply(a, b) {
		if (a === 0) {
			a = Math.pow(2, 16);
		}
		if (b === 0) {
			b = Math.pow(2, 16);
		}
		return (a * b) % (Math.pow(2, 16) + 1);
	}
	function xor(a, b) {
		return (a ^ b);
	}
	function line(m) {
		var el = document.createElement('div');
		m = m.replace('XOR', '&oplus;');
		m = m.replace('MULT', '&otimes;');
		m = m.replace('ADD', '&#8862;');

		if (m.indexOf('h3') === -1) {
			$(el).addClass('operation');
		}

		$(el).html(m);
		return el;
	}

	$('#rand-key').on('click', function () {
		$('.key-row .input-block').each(function (el) {
			$(this).val(Math.floor(Math.random() * 256).toString(16).toUpperCase());
		});
	});

	$('#rand-msg').on('click', function () {
		$('.msg-row .input-block').each(function (el) {
			$(this).val(Math.floor(Math.random() * 256).toString(16).toUpperCase());
		});
	});

	$('.input-block').on('change', function () {
		if (isNaN(parseInt($(this).val(), 16))) {
			$(this).val(0);
		}
	});

	$('#btn-inspect').on('click', function () {
		var	key, msg, wholeKey, wholeMsg, X = [],
			row		=	document.createElement('div'),
			input	=	getInputs();

		key	=	input.key;
		msg	=	input.msg;

		$('#input-grid').empty();
		$('#results-grid').empty();

		// Display initial state
		$('#input-grid').append(
			createRound('Input', [
				createBlock(key),
				createBlock(msg)
			])
		);

		// Store values in strings because JavaScript doesn't like big numbers
		wholeKey = '';
		for (var i = 0; i < key.length; i++) {
			var s = '0000000' + parseInt(key[i], 16).toString(2);
			s = s.substring(s.length - 8);
			wholeKey += s;
		}

		wholeMsg = '';
		for (var i = 0; i < msg.length; i++) {
			var s = '0000000' + parseInt(msg[i], 16).toString(2);
			s = s.substring(s.length - 8);
			wholeMsg += s;
		}

		for (var i = 0; i < 4; i++) {
			X[i] = parseInt(wholeMsg.substr(i * (wholeMsg.length / 4), wholeMsg.length / 4), 2);
		}

		var prevKey = wholeKey;
		for (var i = 0; i < 7; i++) {
			var tmp = prevKey.substr(0, 25);
			prevKey = prevKey.substring(25) + '' + tmp;
			wholeKey += prevKey;
		}

		// Perform rounds
		for (var i = 0; i < 8; i++) {
			var	a,
				log,
				subkey		=	wholeKey.substr(i * 96, 96),
				sk			=	[],
				t			=	[];

			log = document.createElement('div');
			$(log).addClass('log well');
			$(log).on('click', $.proxy($(log).toggleClass, $(log), 'open'));

			for (var j = 0; j < subkey.length; j += 16) {
				sk.push(parseInt(subkey.substr(j, 16), 2));
			}

			$(log).append(line('<h3><span class="icon"></span>Operations for round ' + (i + 1) + '</h3>'));
			$(log).append(line('X<sub>1</sub> = X<sub>1</sub>(' + X[0].toString(16) + ') MULT K<sub>1</sub>(' + sk[0].toString(16) + ')'));
			X[0] = multiply(X[0], sk[0]);
			$(log).append(line('X<sub>4</sub> = X<sub>4</sub>(' + X[3].toString(16) + ') MULT K<sub>4</sub>(' + sk[3].toString(16) + ')'));
			X[3] = multiply(X[3], sk[3]);
			$(log).append(line('X<sub>2</sub> = X<sub>2</sub>(' + X[1].toString(16) + ') ADD K<sub>2</sub>(' + sk[1].toString(16) + ')'));
			X[1] = add(X[1], sk[1]);
			$(log).append(line('X<sub>3</sub> = X<sub>3</sub>(' + X[2].toString(16) + ') ADD K<sub>3</sub>(' + sk[2].toString(16) + ')'));
			X[2] = add(X[2], sk[2]);

			$(log).append(line('t<sub>0</sub> = K<sub>5</sub>(' + sk[4].toString(16) + ') MULT (X<sub>1</sub>(' + X[0].toString(16) + ') XOR X<sub>2</sub>(' + X[2].toString(16) + '))'));
			t[0] = multiply(sk[4], xor(X[0], X[2]));
			$(log).append(line('t<sub>1</sub> = K<sub>6</sub>(' + sk[5].toString(16) + ') MULT (t<sub>0</sub>(' + t[0].toString(16) + ') ADD (X<sub>2</sub>(' + X[1].toString(16) + ') XOR X<sub>4</sub>(' + X[3].toString(16) + ')))'));
			t[1] = multiply(sk[5], add(t[0], xor(X[1], X[3])));
			$(log).append(line('t<sub>2</sub> = t<sub>0</sub>(' + t[0].toString(16) + ') ADD t<sub>1</sub>(' + t[1].toString(16) + ')'));
			t[2] = add(t[0], t[1]);

			$(log).append(line('X<sub>1</sub> = X<sub>1</sub>(' + X[0].toString(16) + ') XOR t<sub>1</sub>(' + t[1].toString(16) + ')'));
			X[0] = xor(X[0], t[1]);
			$(log).append(line('X<sub>4</sub> = X<sub>4</sub>(' + X[3].toString(16) + ') XOR t<sub>2</sub>(' + t[2].toString(16) + ')'));
			X[3] = xor(X[3], t[2]);
			$(log).append(line('a&nbsp; = X<sub>2</sub>(' + X[1].toString(16) + ') XOR t<sub>2</sub>(' + t[2].toString(16) + ')'));
			a = xor(X[1], t[2]);
			$(log).append(line('X<sub>2</sub> = X<sub>3</sub> (' + X[2].toString(16) + ') XOR t<sub>1</sub>(' + t[1].toString(16) + ')'));
			X[1] = xor(X[2], t[1]);
			$(log).append(line('X<sub>3</sub> = a(' + a.toString(16) + ')'));
			X[2] = a;

			$('#results-grid').append(
				createRound('Round ' + (i + 1), [
					createBlock(sk),
					createBlock(X)
				])
			);
			$('#results-grid').append(log);
		}

		// Output Transformation
		var	sk		=	[],
			subkey	=	wholeKey.substr(8 * 96, 64),
			Y		=	[];

		for (var j = 0; j < subkey.length; j += 16) {
			sk.push(parseInt(subkey.substr(j, 16), 2));
		}
		Y[0] = multiply(X[0], sk[0]);
		Y[3] = multiply(X[3], sk[3]);
		Y[1] = add(X[2], sk[1]);
		Y[2] = add(X[1], sk[2]);
		$('#output-grid').append(
			createRound('Output', [
				createBlock(sk),
				createBlock(Y)
			])
		);

		var out = '';
		for (var i = 0; i < Y.length; i++) {
			var s = '000' + Y[i].toString(16);
			s = s.substring(s.length - 4);
			out += s;
		}
		$('#output').text(out);

		$('#results').show();

		$('html, body').animate({
			scrollTop: $('#results').offset().top
		}, 2000);
	});

	$('#results').hide();

	$('.key-row .input-block').each(function (idx) {
		$(this).val((idx.toString(16) + idx.toString(16)).toUpperCase());
	});
	$('.msg-row .input-block').each(function (idx) {
		$(this).val((idx.toString(16) + idx.toString(16)).toUpperCase());
	});
}) ();
