export type Run = {
  player: string
  map: string
  category: string
  time: string
  proof: string
  date: string
  tag: string
}

export type TournamentMatch = {
  matchId: string
  tournamentName: string
  round: string
  division: string
  date: string
  recording: string
  host: string
}

export type TournamentResult = {
  matchId: string
  set: string
  map: string
  format: string
  seed: string
  player: string
  opponent: string
  run1: string
  run1category: string
  run2: string
  run2category: string
  run3: string
  run3category: string
  run4: string
  run4category: string
  run5: string
  run5category: string
  run6: string
  run6category: string
  run7: string
  run7category: string
  run8: string
  run8category: string
  run9: string
  run9category: string
  run10: string
  run10category: string
  average: string
  best: string
}