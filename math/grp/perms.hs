module Main where

import Data.Group.Permutation

data X = Zero | One | Two deriving (Eq, Show)

-- show permutations in the notation above
instance Show Permutation X where
  show (Permutation f _) = "\\begin{pmatrix}Zero & One & Two \\\\" ++
    show(f(Zero)) ++ " & " ++
    show(f(One)) ++ " & " ++
    show(f(Two)) ++ " " ++
    "\\end{pmatrix}"

-- Defining the elements of S₃
s0 = Permutation id id -- identity permutation
s1 = Permutation (\x -> if x==Zero then One else x)
		 (\x -> if x==One then Zero else x)


main :: IO
main = do
  print s0
  print s1
