N = 8

% Create C
C = zeros(N,N);
for m = 0:1:N-1
  for n = 0:1:N-1
    if n == 0
      k = sqrt(1/N);
    else
      k = sqrt(2/N);
    end
    C(m+1,n+1) = k*cos( ((2*m+1)*n*pi) / (2*N));
  end
end
C

% Get Basis Functions
for m = 0:1:N-1
  for n = 0:1:N-1
    Y = [zeros(m,N);
         zeros(1,n) 1 zeros(1,N-n-1);
         zeros(N-m-1,N)];
    X = C'*Y*C;
  end
end
