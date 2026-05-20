# Prompt Architectures

## General Rules

- Let attached images carry identity and look. Let the prompt carry motion, camera, environment reaction, audio, and ending.
- Put camera language early.
- Keep one dominant action per shot.
- Use setup -> trigger -> escalation -> payoff for most 15-second clips.
- Add physical anchors: rain, dust, sparks, debris, cloth delay, reflections, smoke, bubbles, wake rings, drifting particles.
- Avoid asking for readable in-world text unless the text itself is the target artifact.

## 5s I2V Test

```text
Use the attached image as the first frame. 5s continuous shot: [environment continues from image] as the camera [one motivated move]. [Subject] [one dominant action], causing [environment reaction]. [Secondary motion] trails naturally. End on [specific final frame] with a final 0.7 seconds hold. Cinematic realism, physical lighting, natural motion blur. Audio: [ambience], [one key effect], no music.
```

## 10s Structured Shot

```text
FORMAT: 10s / continuous cinematic scene.
(0-3s) Setup: [subject] in [environment] with [mood and lighting].
(3-7s) Trigger: the camera [move] as [single event begins].
(7-10s) Payoff: [clear ending image], final 0.7 seconds hold.
Style: [style family], physical lighting, natural motion blur, cinematic texture.
Audio: [ambient bed], [one or two key sounds].
```

## 15s Core Architecture

```text
FORMAT: 15s / continuous cinematic scene.
(0-3s) Setup: [subject/environment] with [mood].
(3-7s) Trigger: [clear initiating event].
(7-11s) Escalation: [motion or conflict intensifies].
(11-15s) Payoff: [hero moment or aftermath], final 0.7 seconds hold.
Camera: [motivated camera plan].
Style: cinematic realism, physical lighting, shallow depth of field, subtle grain, natural motion blur.
Audio: [ambient bed], [key effects], no music unless requested.
```

## Product / Commercial Architecture

```text
Use the attached product image as the first frame and preserve the real product branding exactly. 15s premium commercial shot.
(0-4s) Hero reveal: the product stands dominant in [premium environment] as the camera [pushes / arcs / glides].
(4-9s) Energy or flavor world blooms around it through [liquid / particles / condensation / light effects] while the label remains crisp and unchanged.
(9-13s) Dynamic product motion or environmental crescendo: [rotation / burst / splash / glow] with controlled, believable material physics.
(13-15s) Final beauty hold on the product hero frame.
Style: high-end commercial cinematography, pristine reflections, rich color separation, stable packaging, no label drift.
Audio: [fizz / crackle / whoosh / room tone], no dialogue unless requested.
```

## UGC / Faux-Documentary Architecture

```text
FORMAT: 10s or 15s / handheld realistic phone footage.
(0-4s) Ordinary believable setup in a mundane space.
(4-8s) Subtle oddity begins.
(8-15s) One surreal break from reality escalates while the camera stays believable and human.
Style: smartphone realism, imperfect framing, practical lighting, natural room sound.
Guardrails: one uncanny hook only, keep everything else grounded.
```

## Stylized / Anime Action Architecture

```text
FORMAT: 15s / stylized action trailer.
(0-3s) Establish the hero in [world] with strong silhouette and mood.
(3-6s) Threat or challenge emerges.
(6-11s) Fast readable action burst with 2 to 3 clear contact snapshots and controlled motion streaks.
(11-15s) Final impact or heroic aftermath hold.
Camera: aggressive but readable, low-angle chase / lateral track / impact pull-back.
Style: [anime or stylized look], strong highlights, speed accents, clean silhouette readability.
```

## Fight Prompt Scaffold

```text
FORMAT: 15s / continuous fight
CHARACTERS
A: [character_A]
B: [character_B]
ENVIRONMENT
[short description]
FIGHT PROFILE
STYLE: [brutal / elegant / tactical / chaotic / cinematic]
ENERGY: [low / medium / high / explosive]
WEAPONS: [none / melee / mixed]
INTENT: [duel / assassination / survival / dominance / training]
VISUAL
Cinematic realism, physical lighting, shallow DOF, subtle grain, natural motion blur.
DIRECTIVE
No fixed choreography. Fight emerges dynamically from characters, environment, and momentum.
BEHAVIOR
- Use environment freely.
- Allow verticality.
- Encourage unexpected but physically valid actions.
RULES
- Momentum chain only.
- Clear positioning at all times.
- Continuous motivated camera.
- Environment reacts visibly.
IMPACT
Strong contacts: 2-frame hold + brightness spike + micro shake resume.
RHYTHM
Fast exchanges + micro pauses + 1 to 2 slow-motion beats.
ESCALATION
Include one vertical/environment-driven move and one decisive high-impact action.
HERO MOMENT
One standout finishing beat with strong silhouette or positional advantage.
GUARDRAILS
No teleporting. Respect weight and inertia. Clear cause and effect. Prioritize clarity over complexity.
```

## Storyboard Translation Notes

- Full storyboard sheets are usually best as `Reference`, not `First Frame`.
- A clean single still from beat 1 is usually best as `First Frame`.
- If exact sequencing matters, split the sheet into separate shot stills and generate per shot.
- Motion sheets teach rhythm and mechanics; they do not guarantee exact panel order.
