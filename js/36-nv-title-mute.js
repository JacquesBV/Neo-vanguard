
/* Écran titre : la démo qui tourne derrière le menu ne doit faire aucun bruit
   de jeu. La puce sonore LCD interceptait « shoot » avant la garde d'origine. */
(() => { const _s = Audio2.sfx; Audio2.sfx = function (name) { if (typeof G !== 'undefined' && G.state === 'title' && name !== 'ui') return; return _s.apply(this, arguments); }; })();
