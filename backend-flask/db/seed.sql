-- this file was manually created
INSERT INTO public.users (display_name, handle, email, cognito_user_id)
VALUES
  ('roopish', 'roopish' ,'rm@gmail.com','26b882d5-8c11-4bea-a7e9-bb0a1ef65742'),
  ('Andrew Brown', 'andrewbrown' ,'a@br.com', '26b882d5-8c11-4bea-a7e9-bb0a1ef65742'),
  ('Londo Mollari','londo','lmollari@centari.com' ,'26b882d5-8c11-4bea-a7e9-bb0a1ef65742'),
  ('Andrew Bayko', 'bayko' ,'a@ba.com','26b882d5-8c11-4bea-a7e9-bb0a1ef65742');

\echo 'inserted into users table'
INSERT INTO public.activities (user_uuid, message, expires_at)
VALUES
  (
    (SELECT uuid from public.users WHERE users.handle = 'andrewbrown' LIMIT 1),
    'This was imported as seed data!',
    current_timestamp + interval '10 day'
  )
\echo 'inserted into activities table'