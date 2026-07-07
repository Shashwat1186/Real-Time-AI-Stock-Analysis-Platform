import { getAllUsersForNewsEmail } from './lib/actions/user.actions';

async function test() {
  console.log('Testing getAllUsersForNewsEmail...');
  const users = await getAllUsersForNewsEmail();
  console.log('Final Result:', users);
  process.exit(0);
}

test();
