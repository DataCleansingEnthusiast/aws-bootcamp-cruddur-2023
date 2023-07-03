-- this file was manually created
INSERT INTO public.users (display_name, handle, email, cognito_user_id)
VALUES
  ('roopish', 'roopish' ,'roopish3554@gmail.com','26b882d5-8c11-4bea-a7e9-bb0a1ef65742'),
  ('roopish1', 'roopish1' ,'roopish98@gmail.com','26b882d5-8c11-4bea-a7e9-bb0a1ef65742'),
  ('Andrew Brown', 'andrewbrown' ,'a@br.com', 'MOCK'),
  ('Andrew Bayko', 'bayko' ,'a@ba.com','MOCK'),
  ('Londo Mollari','londo' ,'lmollari@centari.com' ,'MOCK');

\echo 'inserted into users table'
INSERT INTO public.activities (user_uuid, message, expires_at)
VALUES
  (
    (SELECT uuid from public.users WHERE users.handle = 'roopish' LIMIT 1),
    'This was imported as seed data!',
    current_timestamp + interval '10 day'
  ),
  (
    (SELECT uuid from public.users WHERE users.handle = 'roopish1' LIMIT 1),
    'I am the other user!',    
    current_timestamp + interval '1 day'
  );
\echo 'inserted into activities table'