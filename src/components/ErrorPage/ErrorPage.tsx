import { Link } from '../Link';
import { PageHeading } from '../PageHeading';

export function ErrorPage() {
  return (
    <>
      <PageHeading>Sorry, there’s a problem with this page</PageHeading>
      <p>Try again later.</p>
      <p>
        <Link to="/">Go to the home page</Link>
      </p>
    </>
  );
}
