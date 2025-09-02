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

  // Build 59 beads: 1 OF + 3 HM + 5*(1 OF + 10 HM)
  function buildBeads() {
    const beads = [];
    beads.push({ kind: 'of' });
    for (let i = 0; i < 3; i++) beads.push({ kind: 'hm' });
    for (let d = 0; d < 5; d++) {
      beads.push({ kind: 'of' });
      for (let i = 0; i < 10; i++) beads.push({ kind: 'hm' });
    }
    return beads; // length 59
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

    const width = 900, height = 280;
    const cx = width / 2, cy = height / 2;
    const a = 360, b = 110; // ellipse radii

    beads.forEach((bData, i) => {
      const theta = (2 * Math.PI * i / beads.length) - Math.PI / 2; // start at top
      const x = cx + a * Math.cos(theta);
      const y = cy + b * Math.sin(theta);
      const r = bData.kind === 'of' ? 7 : 5;
      const bead = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
      bead.setAttribute('cx', String(x));
      bead.setAttribute('cy', String(y));
      bead.setAttribute('r', String(r));
      bead.setAttribute('data-index', String(i));
      bead.setAttribute('fill', bData.kind === 'of' ? getComputedStyle(document.documentElement).getPropertyValue('--bead-of') : getComputedStyle(document.documentElement).getPropertyValue('--bead'));
      bead.setAttribute('stroke', '#888');
      bead.setAttribute('stroke-width', '0.6');
      svg.appendChild(bead);
    });
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
    const cardTitle = $('#cardTitle');
    const cardText = $('#cardText');
    const stepInfo = $('#stepInfo');

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

    let state = {
      lang: langSel.value,
      set: todays,
      steps: buildSteps(todays, langSel.value),
      idx: 0,
    };

    function render() {
      const step = state.steps[state.idx];
      cardTitle.textContent = step.title || '';
      cardText.textContent = step.text || '';
      stepInfo.textContent = `Step ${state.idx + 1} / ${state.steps.length}`;
      updateBeadsHighlight(state.steps, state.idx);
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

    prevBtn.addEventListener('click', () => {
      state.idx = Math.max(0, state.idx - 1);
      render();
    });
    nextBtn.addEventListener('click', () => {
      state.idx = Math.min(state.steps.length - 1, state.idx + 1);
      render();
    });

    render();
  }

  window.addEventListener('DOMContentLoaded', init);
})();

