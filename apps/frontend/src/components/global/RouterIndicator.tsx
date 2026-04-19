import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { usePathname } from "next/navigation";

interface RouterIndicatorProps {
  firstPath?: string;
  secondPath?: string;
  thirdPath?: string;
  fourthPath?: string;
}

const RouterIndicator: React.FC<RouterIndicatorProps> = ({
  firstPath,
  secondPath,
  thirdPath,
  fourthPath,
}) => {
  const path = usePathname();
  const paths = path?.split("/").slice(1) || [];
  const linkClassName =
    "text-base hover:text-gray-400 dark:hover:text-white transition-colors";

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink href={`/${paths[1]}`}>
            <p className={linkClassName}>{paths[1]}</p>
          </BreadcrumbLink>
        </BreadcrumbItem>
        {paths[2] && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${paths[1]}/${paths[2]}`}>
                <p className={linkClassName}>{paths[2]}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {paths[3] && paths[3].length < 16 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${paths[1]}/${paths[2]}/${paths[3]}`}>
                <p className={linkClassName}>{paths[3]}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
        {paths[4] && paths[4].length < 16 && (
          <>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${paths[1]}/${paths[2]}/${paths[3]}/${paths[4]}`}
              >
                <p className={linkClassName}>{paths[4]}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}

        {firstPath && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${firstPath}`}>
                <p className={linkClassName}>{firstPath}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {secondPath && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${firstPath}/${secondPath}`}>
                <p className={linkClassName}>{secondPath}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}

        {thirdPath && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink href={`/${firstPath}/${secondPath}/${thirdPath}`}>
                <p className={linkClassName}>{thirdPath}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
          </>
        )}
        {fourthPath && (
          <>
            <BreadcrumbItem>
              <BreadcrumbLink
                href={`/${firstPath}/${secondPath}/${thirdPath}/${fourthPath}`}
              >
                <p className={linkClassName}>{fourthPath}</p>
              </BreadcrumbLink>
            </BreadcrumbItem>
          </>
        )}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default RouterIndicator;
