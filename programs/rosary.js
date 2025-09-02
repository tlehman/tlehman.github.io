(() => {
  const $ = (sel) => document.querySelector(sel);

  const prayers = {
    en: {
      sign: "In the name of the Father, and of the Son, and of the Holy Spirit. Amen.",
      creed: `I believe in God, the Father almighty, Creator of heaven and earth, and in Jesus Christ, his only Son, our Lord, who was conceived by the Holy Spirit, born of the Virgin Mary, suffered under Pontius Pilate, was crucified, died and was buried; he descended into hell; on the third day he rose again from the dead; he ascended into heaven, and is seated at the right hand of God the Father almighty; from there he will come to judge the living and the dead. I believe in the Holy Spirit, the holy Catholic Church, the communion of saints, the forgiveness of sins, the resurrection of the body, and life everlasting. Amen.`,
      ourFather: "Our Father, who art in heaven, hallowed be thy name; thy kingdom come; thy will be done on earth as it is in heaven. Give us this day our daily bread; and forgive us our trespasses, as we forgive those who trespass against us; and lead us not into temptation, but deliver us from evil. Amen.",
      hailMary: "Hail Mary, full of grace, the Lord is with thee; blessed art thou among women, and blessed is the fruit of thy womb, Jesus. Holy Mary, Mother of God, pray for us sinners, now and at the hour of our death. Amen.",
      gloryBe: "Glory be to the Father, and to the Son, and to the Holy Spirit. As it was in the beginning, is now, and ever shall be, world without end. Amen.",
      fatima: "O my Jesus, forgive us our sins, save us from the fires of hell; lead all souls to heaven, especially those in most need of thy mercy.",
      hailHolyQueen: `Hail, holy Queen, Mother of mercy, our life, our sweetness, and our hope. To thee do we cry, poor banished children of Eve; to thee do we send up our sighs, mourning and weeping in this valley of tears. Turn then, most gracious advocate, thine eyes of mercy toward us; and after this our exile, show unto us the blessed fruit of thy womb, Jesus. O clement, O loving, O sweet Virgin Mary.\n\nV. Pray for us, O holy Mother of God.\nR. That we may be made worthy of the promises of Christ.`,
      closing: `Let us pray. O God, whose Only Begotten Son, by his life, death, and resurrection, has purchased for us the rewards of eternal life, grant, we beseech thee, that meditating upon these mysteries of the Most Holy Rosary of the Blessed Virgin Mary, we may imitate what they contain and obtain what they promise, through the same Christ our Lord. Amen.`,
    },
    la: {
      sign: "In nomine Patris, et Filii, et Spiritus Sancti. Amen.",
      creed: `Credo in Deum, Patrem omnipotentem, Creatorem caeli et terrae; et in Iesum Christum, Filium eius unicum, Dominum nostrum, qui conceptus est de Spiritu Sancto, natus ex Maria Virgine, passus sub Pontio Pilato, crucifixus, mortuus, et sepultus; descendit ad inferos; tertia die resurrexit a mortuis; ascendit ad caelos, sedet ad dexteram Dei Patris omnipotentis; inde venturus est iudicare vivos et mortuos. Credo in Spiritum Sanctum, sanctam Ecclesiam catholicam, sanctorum communionem, remissionem peccatorum, carnis resurrectionem, vitam aeternam. Amen.`,
      ourFather: "Pater noster, qui es in caelis: sanctificetur nomen tuum; adveniat regnum tuum; fiat voluntas tua, sicut in caelo et in terra. Panem nostrum quotidianum da nobis hodie; et dimitte nobis debita nostra, sicut et nos dimittimus debitoribus nostris; et ne nos inducas in tentationem; sed libera nos a malo. Amen.",
      hailMary: "Ave Maria, gratia plena, Dominus tecum; benedicta tu in mulieribus, et benedictus fructus ventris tui, Iesus. Sancta Maria, Mater Dei, ora pro nobis peccatoribus, nunc et in hora mortis nostrae. Amen.",
      gloryBe: "Gloria Patri, et Filio, et Spiritui Sancto. Sicut erat in principio, et nunc, et semper, et in saecula saeculorum. Amen.",
      fatima: "Domine Iesu, dimitte nobis debita nostra, libera nos ab igne inferni, perduc in caelum omnes animas, praesertim eas quae misericordiae tuae maxime indigent.",
      hailHolyQueen: `Salve, Regina, mater misericordiae; vita, dulcedo, et spes nostra, salve. Ad te clamamus, exsules filii Hevae; ad te suspiramus, gementes et flentes in hac lacrimarum valle. Eia ergo, advocata nostra, illos tuos misericordes oculos ad nos converte; et Iesum, benedictum fructum ventris tui, nobis post hoc exsilium ostende. O clemens, O pia, O dulcis Virgo Maria.\n\nV. Ora pro nobis, sancta Dei Genetrix.\nR. Ut digni efficiamur promissionibus Christi.`,
      closing: `Oremus. Deus, cuius Unigenitus, per vitam, mortem et resurrectionem suam, nobis salutis aeternae praemia comparavit: concede, quaesumus; ut haec mysteria sacratissimi Rosarii Beatae Mariae Virginis recolentes, et imitemur quod continent, et quod promittunt assequamur. Per eundem Christum Dominum nostrum. Amen.`,
    }
  };

  const mysteries = {
    joyful: [
      "The Annunciation",
      "The Visitation",
      "The Nativity",
      "The Presentation",
      "Finding Jesus in the Temple",
    ],
    sorrowful: [
      "The Agony in the Garden",
      "The Scourging at the Pillar",
      "The Crowning with Thorns",
      "Carrying of the Cross",
      "The Crucifixion",
    ],
    glorious: [
      "The Resurrection",
      "The Ascension",
      "The Descent of the Holy Spirit",
      "The Assumption",
      "The Coronation of Mary",
    ],
    luminous: [
      "The Baptism in the Jordan",
      "The Wedding at Cana",
      "The Proclamation of the Kingdom",
      "The Transfiguration",
      "The Institution of the Eucharist",
    ],
  };

  function defaultMysterySet() {
    const day = new Date().getDay(); // 0=Sun
    switch (day) {
      case 0: return 'glorious';
      case 1: return 'joyful';
      case 2: return 'sorrowful';
      case 3: return 'glorious';
      case 4: return 'luminous';
      case 5: return 'sorrowful';
      case 6: return 'joyful';
      default: return 'glorious';
    }
  }

  // Build 54 beads: 1 OF + 3 HM + 5*(1 OF + 10 HM)
  function buildBeads() {
    const beads = [];
    beads.push({ kind: 'of' });
    for (let i = 0; i < 3; i++) beads.push({ kind: 'hm' });
    for (let d = 0; d < 5; d++) {
      beads.push({ kind: 'of' });
      for (let i = 0; i < 10; i++) beads.push({ kind: 'hm' });
    }
    return beads; // length 54
  }

  function buildSteps(set, lang) {
    const steps = [];
    let beadIndex = -1;

    steps.push({ title: lang === 'la' ? 'Signum Crucis' : 'Sign of the Cross', text: prayers[lang].sign, beadIndex: null });
    steps.push({ title: lang === 'la' ? 'Symbolum Apostolorum' : 'Apostles’ Creed', text: prayers[lang].creed, beadIndex: null });

    // Introductory beads
    steps.push({ title: lang === 'la' ? 'Pater Noster' : 'Our Father', text: prayers[lang].ourFather, beadIndex: ++beadIndex });
    for (let i = 0; i < 3; i++) {
      steps.push({ title: lang === 'la' ? 'Ave Maria' : 'Hail Mary', text: prayers[lang].hailMary, beadIndex: ++beadIndex });
    }
    steps.push({ title: lang === 'la' ? 'Gloria Patri' : 'Glory Be', text: prayers[lang].gloryBe, beadIndex: null });

    // Five decades
    mysteries[set].forEach((mysteryTitle, decade) => {
      steps.push({ title: `${lang === 'la' ? 'Mysterium' : 'Mystery'} ${decade + 1}: ${mysteryTitle}`, text: '', beadIndex: null });
      steps.push({ title: lang === 'la' ? 'Pater Noster' : 'Our Father', text: prayers[lang].ourFather, beadIndex: ++beadIndex });
      for (let i = 0; i < 10; i++) {
        steps.push({ title: lang === 'la' ? 'Ave Maria' : 'Hail Mary', text: prayers[lang].hailMary, beadIndex: ++beadIndex });
      }
      steps.push({ title: lang === 'la' ? 'Gloria Patri' : 'Glory Be', text: prayers[lang].gloryBe, beadIndex: null });
      steps.push({ title: lang === 'la' ? 'Oratio Fatimae' : 'Fatima Prayer', text: prayers[lang].fatima, beadIndex: null });
    });

    steps.push({ title: lang === 'la' ? 'Salve Regina' : 'Hail Holy Queen', text: prayers[lang].hailHolyQueen, beadIndex: null });
    steps.push({ title: lang === 'la' ? 'Oratio conclusiva' : 'Closing Prayer', text: prayers[lang].closing, beadIndex: null });
    steps.push({ title: lang === 'la' ? 'Signum Crucis' : 'Sign of the Cross', text: prayers[lang].sign, beadIndex: null });

    return steps;
  }

  function renderRosarySVG(beads) {
    const svg = $('#rosary');
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    const width = 900, height = 620;
    const cx = width / 2, cy = 230; // loop center higher to leave room for tail
    const rx = 160, ry = 220, rot = 8; // squeeze horizontally, taller loop

    const ns = 'http://www.w3.org/2000/svg';

    // Group for styling
    const g = document.createElementNS(ns, 'g');
    svg.appendChild(g);

    // Draw loop path (start at bottom of loop)
    const loopPath = document.createElementNS(ns, 'path');
    loopPath.setAttribute('d', `M ${cx} ${cy + ry} a ${rx} ${ry} ${rot} 1 1 0 ${-2 * ry} a ${rx} ${ry} ${rot} 1 1 0 ${2 * ry}`);
    loopPath.setAttribute('fill', 'none');
    loopPath.setAttribute('stroke', 'rgba(0,0,0,0.15)');
    loopPath.setAttribute('stroke-dasharray', '2 8');
    g.appendChild(loopPath);

    // Tail path from near bottom of loop to cross
    const attach = { x: cx, y: cy + ry };
    const crossPos = { x: cx, y: 560 };
    const c1 = { x: cx + 28, y: attach.y + 60 };
    const c2 = { x: cx - 36, y: crossPos.y - 100 };
    const tailPath = document.createElementNS(ns, 'path');
    tailPath.setAttribute('d', `M ${attach.x} ${attach.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${crossPos.x} ${crossPos.y}`);
    tailPath.setAttribute('fill', 'none');
    tailPath.setAttribute('stroke', 'rgba(0,0,0,0.15)');
    tailPath.setAttribute('stroke-dasharray', '2 8');
    g.appendChild(tailPath);

    // Draw cross
    const cross = document.createElementNS(ns, 'g');
    const crossColor = '#aaa';
    const strokeColor = '#7a6a56';
    // vertical bar
    const v = document.createElementNS(ns, 'rect');
    v.setAttribute('x', String(crossPos.x - 5));
    v.setAttribute('y', String(crossPos.y - 24));
    v.setAttribute('width', '10');
    v.setAttribute('height', '56');
    v.setAttribute('rx', '2');
    v.setAttribute('fill', crossColor);
    //v.setAttribute('stroke', strokeColor);
    v.setAttribute('stroke-width', '1');
    cross.appendChild(v);
    // horizontal bar
    const h = document.createElementNS(ns, 'rect');
    h.setAttribute('x', String(crossPos.x - 18));
    h.setAttribute('y', String(crossPos.y - 8));
    h.setAttribute('width', '36');
    h.setAttribute('height', '12');
    h.setAttribute('rx', '2');
    h.setAttribute('fill', crossColor);
    //h.setAttribute('stroke', strokeColor);
    h.setAttribute('stroke-width', '1');
    cross.appendChild(h);
    g.appendChild(cross);

    const beadFill = getComputedStyle(document.documentElement).getPropertyValue('--bead') || '#d6d6d6';
    const beadFillOF = getComputedStyle(document.documentElement).getPropertyValue('--bead-of') || '#a3a3a3';

    // Place tail beads: indices 0..3 along tail path from cross upwards
    const tailLen = tailPath.getTotalLength();
    // Fractions along attach->cross; nudge beads slightly upward toward the loop
    const tailFractions = [0.70, 0.52, 0.37, 0.20];
    for (let i = 0; i < 4; i++) {
      const frac = tailFractions[i];
      const pt = tailPath.getPointAtLength(frac * tailLen);
      const bData = beads[i];
      const r = bData.kind === 'of' ? 7 : 5;
      const bead = document.createElementNS(ns, 'circle');
      bead.setAttribute('cx', String(pt.x));
      bead.setAttribute('cy', String(pt.y));
      bead.setAttribute('r', String(r));
      bead.setAttribute('data-index', String(i));
      bead.setAttribute('fill', bData.kind === 'of' ? beadFillOF.trim() : beadFill.trim());
      bead.setAttribute('stroke', '#888');
      bead.setAttribute('stroke-width', '0.6');
      g.appendChild(bead);
    }

    // Place loop beads: indices 4..end around loop starting at bottom (attach)
    const loopLen = loopPath.getTotalLength();
    const loopCount = beads.length - 4; // 55
    const step = loopLen / loopCount;
    for (let j = 0; j < loopCount; j++) {
      const idx = 4 + j;
      let pt = loopPath.getPointAtLength(j * step + 2); // slight offset to avoid overlap
      // Add subtle natural variation
      const wobble = (k) => Math.sin((k + 1) * 0.7) * 2.5;
      const wobbleY = (k) => Math.cos((k + 1) * 0.6) * 3.2;
      pt = { x: pt.x + wobble(j), y: pt.y + wobbleY(j) };
      const bData = beads[idx];
      const r = bData.kind === 'of' ? 7 : 5;
      const bead = document.createElementNS(ns, 'circle');
      bead.setAttribute('cx', String(pt.x));
      bead.setAttribute('cy', String(pt.y));
      bead.setAttribute('r', String(r));
      bead.setAttribute('data-index', String(idx));
      bead.setAttribute('fill', bData.kind === 'of' ? beadFillOF.trim() : beadFill.trim());
      bead.setAttribute('stroke', '#888');
      bead.setAttribute('stroke-width', '0.6');
      g.appendChild(bead);
    }
  }

  function updateBeadsHighlight(steps, currentStepIndex) {
    const svg = $('#rosary');
    const accent = getComputedStyle(document.documentElement).getPropertyValue('--accent') || '#B71C1C';
    const beadFill = getComputedStyle(document.documentElement).getPropertyValue('--bead') || '#d6d6d6';
    const beadFillOF = getComputedStyle(document.documentElement).getPropertyValue('--bead-of') || '#a3a3a3';

    // Determine which bead indices have been completed
    const visited = new Set();
    for (let i = 0; i <= currentStepIndex; i++) {
      const step = steps[i];
      if (step && step.beadIndex !== null && step.beadIndex !== undefined) {
        visited.add(step.beadIndex);
      }
    }

    svg.querySelectorAll('circle').forEach((c) => {
      const idx = Number(c.getAttribute('data-index'));
      if (visited.has(idx)) {
        c.setAttribute('fill', accent.trim());
      } else {
        // reset to default based on type (approx via radius)
        const r = Number(c.getAttribute('r'));
        c.setAttribute('fill', r > 6 ? beadFillOF.trim() : beadFill.trim());
      }
    });
  }

  function init() {
    const langSel = $('#language');
    const setSel = $('#mysterySet');
    const prevBtn = $('#prev');
    const nextBtn = $('#next');
    const resetBtn = $('#reset');
    const cardTitle = $('#cardTitle');
    const cardText = $('#cardText');
    const stepInfo = $('#stepInfo');
    const cardEl = document.querySelector('article.card');

    const beads = buildBeads();
    renderRosarySVG(beads);

    const todays = defaultMysterySet();
    const setNames = {
      joyful: 'Joyful', sorrowful: 'Sorrowful', glorious: 'Glorious', luminous: 'Luminous'
    };
    // Populate mystery set selector
    const autoLabel = `Auto (Today: ${setNames[todays]})`;
    const autoOpt = document.createElement('option');
    autoOpt.value = `auto:${todays}`; autoOpt.textContent = autoLabel; setSel.appendChild(autoOpt);
    ['joyful','sorrowful','glorious','luminous'].forEach(key => {
      const o = document.createElement('option');
      o.value = key; o.textContent = setNames[key]; setSel.appendChild(o);
    });
    setSel.value = `auto:${todays}`;

    // Restore language and step from localStorage if present
    const savedLang = localStorage.getItem('rosary.lang');
    if (savedLang && (savedLang === 'en' || savedLang === 'la')) {
      langSel.value = savedLang;
    }

    let state = {
      lang: langSel.value,
      set: todays,
      steps: buildSteps(todays, langSel.value),
      idx: 0,
    };

    const savedIdxStr = localStorage.getItem('rosary.idx');
    if (savedIdxStr !== null) {
      const n = Number(savedIdxStr);
      if (Number.isFinite(n)) state.idx = Math.max(0, Math.min(n, state.steps.length - 1));
    }

    function render() {
      const step = state.steps[state.idx];
      cardTitle.textContent = step.title || '';
      cardText.textContent = step.text || '';
      stepInfo.textContent = `Step ${state.idx + 1} / ${state.steps.length}`;
      updateBeadsHighlight(state.steps, state.idx);
      // Persist minimal state
      try {
        localStorage.setItem('rosary.lang', state.lang);
        localStorage.setItem('rosary.idx', String(state.idx));
      } catch (_) {}
    }

    function rebuildSteps(preserveIndex = false) {
      const idxBefore = state.idx;
      state.steps = buildSteps(state.set, state.lang);
      state.idx = preserveIndex ? Math.min(idxBefore, state.steps.length - 1) : 0;
      render();
    }

    langSel.addEventListener('change', () => {
      state.lang = langSel.value;
      rebuildSteps(true);
    });

    setSel.addEventListener('change', () => {
      const v = setSel.value;
      state.set = v.startsWith('auto:') ? v.split(':')[1] : v;
      rebuildSteps(false);
    });

    function goPrev() {
      state.idx = Math.max(0, state.idx - 1);
      render();
    }
    function goNext() {
      state.idx = Math.min(state.steps.length - 1, state.idx + 1);
      render();
    }

    prevBtn.addEventListener('click', goPrev);
    nextBtn.addEventListener('click', goNext);

    // Swipe right on the prayer card advances to Next
    if (cardEl) {
      let startX = 0, startY = 0, startTime = 0;
      const threshold = 50; // min px for horizontal swipe
      const restraint = 80; // max px vertical drift allowed
      const allowedTime = 600; // ms

      cardEl.addEventListener('touchstart', (e) => {
        const t = e.changedTouches[0];
        startX = t.pageX; startY = t.pageY; startTime = Date.now();
      }, { passive: true });

      cardEl.addEventListener('touchend', (e) => {
        const t = e.changedTouches[0];
        const dx = t.pageX - startX;
        const dy = Math.abs(t.pageY - startY);
        const elapsed = Date.now() - startTime;
        if (elapsed <= allowedTime && dx > threshold && dy < restraint) {
          goNext();
        }
      });
    }

    resetBtn.addEventListener('click', () => {
      // Clear localStorage keys and reset state
      try {
        localStorage.removeItem('rosary.lang');
        localStorage.removeItem('rosary.idx');
      } catch (_) {}
      langSel.value = 'en';
      setSel.value = `auto:${todays}`;
      state.lang = 'en';
      state.set = todays;
      state.steps = buildSteps(state.set, state.lang);
      state.idx = 0;
      render();
    });

    render();
  }

  window.addEventListener('DOMContentLoaded', init);
})();
