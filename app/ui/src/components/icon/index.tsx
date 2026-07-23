//@ts-nocheck
import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import React from "react";
import {SizeProp} from "@fortawesome/fontawesome-svg-core";
import {
  faAddressBook,
  faArrowDown,
  faArrowRight,
  faArrowUp,
  faArrowUpRightFromSquare,
  faAsterisk,
  faBell,
  faBookmark,
  faChartSimple,
  faCheck,
  faChevronDown,
  faChevronLeft,
  faChevronRight,
  faChevronUp,
  faCircleCheck,
  faCircleInfo,
  faClock,
  faClone,
  faClose,
  faCode,
  faCodeFork,
  faCog,
  faEdit,
  faEye,
  faFile,
  faFileCirclePlus,
  faFilter,
  faHashtag,
  faHome,
  faHourglassEnd,
  faLeftRight,
  faLightbulb,
  faMoneyBill,
  faPaperPlane,
  faPlus,
  faPowerOff,
  faQuestion,
  faRefresh,
  faRoute,
  faSearch,
  faSkull,
  faSlash,
  faSquareMinus,
  faStar,
  faToolbox,
  faTrash,
  faTriangleExclamation,
  faUpload,
  faUserGroup,
  faX,
  faXmarkCircle,
} from '@fortawesome/free-solid-svg-icons'

type IconProps = {
    icon?: any
    size?: SizeProp | undefined
    style?: React.CSSProperties | undefined
    onClick?: any | undefined
}

const defaultSize: SizeProp = "sm"

export const IconComponent: React.FC<IconProps> = ({icon, size = defaultSize, style, onClick}) => <FontAwesomeIcon onClick={onClick} icon={icon} size={size} style={{...{ cursor: onClick ? "pointer" : "" }, ...style}}/>
export const IconNetwork: React.FC<IconProps> = (props) => <IconComponent icon={faChartNetwork} {...props} />
export const IconFork: React.FC<IconProps> = (props) => <IconComponent icon={faCodeFork} {...props} />
export const IconSkull: React.FC<IconProps> = (props) => <IconComponent icon={faSkull} {...props}/>
export const IconCross: React.FC<IconProps> = (props) => <IconComponent icon={faClose} {...props}/>
export const IconClock: React.FC<IconProps> = (props) => <IconComponent icon={faClock} {...props}/>
export const IconFilesCirclePlus: React.FC<IconProps> = (props) => <IconComponent icon={faFileCirclePlus} {...props}/>
export const IconAddressBook: React.FC<IconProps> = (props) => <IconComponent icon={faAddressBook} {...props}/>
export const IconHourglassEnd: React.FC<IconProps> = (props) => <IconComponent icon={faHourglassEnd} {...props}/>
export const IconCode: React.FC<IconProps> = (props) => <IconComponent icon={faCode} {...props}/>
export const IconArrowUp: React.FC<IconProps> = (props) => <IconComponent icon={faArrowUp} {...props}/>
export const IconArrowDown: React.FC<IconProps> = (props) => <IconComponent icon={faArrowDown} {...props}/>
export const IconSquareMinus: React.FC<IconProps> = (props) => <IconComponent icon={faSquareMinus} {...props}/>
export const IconPowerOff: React.FC<IconProps> = (props) => <IconComponent icon={faPowerOff} {...props}/>
export const IconLightbulb: React.FC<IconProps> = (props) => <IconComponent className="fa-light" icon={faLightbulb} {...props}/>
export const IconResize: React.FC<IconProps> = (props) => <IconComponent icon={faLeftRight} {...props}/>
export const IconAdd: React.FC<IconProps> = (props) => <IconComponent icon={faPlus} {...props}/>
export const IconWarning: React.FC<IconProps> = (props) => <IconComponent icon={faTriangleExclamation} {...props}/>
export const IconDelete: React.FC<IconProps> = (props) => <IconComponent icon={faTrash} {...props}/>
export const IconUpload: React.FC<IconProps> = (props) => <IconComponent icon={faUpload} {...props}/>
export const IconEdit: React.FC<IconProps> = (props) => <IconComponent icon={faEdit} {...props}/>
export const IconSettings: React.FC<IconProps> = (props) => <IconComponent icon={faCog} {...props}/>
export const IconHome: React.FC<IconProps> = (props) => <IconComponent icon={faHome} {...props}/>
export const IconSearch: React.FC<IconProps> = (props) => <IconComponent icon={faSearch} {...props}/>
export const IconX: React.FC<IconProps> = (props) => <IconComponent icon={faX} {...props}/>
export const IconXCircle: React.FC<IconProps> = (props) => <IconComponent icon={faXmarkCircle} {...props}/>
export const IconCircleCheck: React.FC<IconProps> = (props) => <IconComponent icon={faCircleCheck} {...props}/>
export const IconCheck: React.FC<IconProps> = (props) => <IconComponent icon={faCheck} {...props}/>
export const IconLink: React.FC<IconProps> = (props) => <IconComponent icon={faArrowUpRightFromSquare} {...props}/>
export const IconSpreadsheet: React.FC<IconProps> = (props) => <IconComponent icon={faFileSpreadsheet} {...props} />
export const IconTrash: React.FC<IconProps> = (props) => <IconComponent icon={faTrash} {...props}/>
export const IconHelp: React.FC<IconProps> = (props) => <IconComponent icon={faQuestion} {...props}/>
export const IconChevronLeft: React.FC<IconProps> = (props) => <IconComponent icon={faChevronLeft} {...props}/>
export const IconPublish: React.FC<IconProps> = (props) => <IconComponent icon={faPaperPlane} {...props}/>
export const IconChevronRight: React.FC<IconProps> = (props) => <IconComponent icon={faChevronRight} {...props}/>
export const IconChevronDown: React.FC<IconProps> = (props) => <IconComponent icon={faChevronDown} {...props}/>
export const IconChevronUp: React.FC<IconProps> = (props) => <IconComponent icon={faChevronUp} {...props}/>
export const IconRefresh: React.FC<IconProps> = (props) => <IconComponent icon={faRefresh} {...props}/>
export const IconLoading: React.FC<IconProps> = (props) => <IconComponent icon={faRefresh} spin {...props}/>
export const IconBell: React.FC<IconProps> = (props) => <IconComponent icon={faBell} {...props}/>
export const IconInfo: React.FC<IconProps> = (props) => <IconComponent icon={faCircleInfo} {...props}/>
export const IconHash: React.FC<IconProps> = (props) => <IconComponent icon={faHashtag} {...props}/>
export const IconEye: React.FC<IconProps> = (props) => <IconComponent icon={faEye} {...props} />
export const IconStar: React.FC<IconProps> = (props) => <IconComponent icon={faStar} {...props} />
export const IconProcess: React.FC<IconProps> = (props) => <IconComponent icon={faPrintMagnifyingGlass} {...props} />
export const IconArrowRight: React.FC<IconProps> = (props) => <IconComponent icon={faArrowRight} {...props} />
export const IconMoney: React.FC<IconProps> = (props) => <IconComponent icon={faMoneyBill} {...props} />
export const IconDrag: React.FC<IconProps> = (props) => <IconComponent icon={faGripDotsVertical} {...props} />
export const IconBookmark: React.FC<IconProps> = (props) => <IconComponent inverse icon={faBookmark} {...props} />

export const IconAsterisk: React.FC<IconProps> = (props) => <IconComponent icon={faAsterisk} {...props} />
export const IconFile: React.FC<IconProps> = (props) => <IconComponent icon={faFile} {...props} />

export const IconPlmn = IconAddressBook
export const IconSender = IconHash


export const IconNoMoney: React.FC<IconProps> = ({size = defaultSize, style}) => {
    return <span className="fa-layers fa-fw">
        <FontAwesomeIcon icon={faMoneyBill} size={size} style={style} />
        {/*<FontAwesomeIcon icon={faX} size={"xs"} color={"red"} style={style} />*/}
    </span>
}
export const IconNoRoute: React.FC<IconProps> = ({size = defaultSize, style}) => {
    return <span className="fa-layers fa-fw">
        <FontAwesomeIcon icon={faRoute} size={size} style={style} />
        {/*<FontAwesomeIcon icon={faX} size={"xs"} color={"red"} style={style} />*/}
    </span>
}

export const IconClash: React.FC<IconProps> = ({size = defaultSize, style}) => {
    return <span className="fa-layers fa-fw">
        <FontAwesomeIcon icon={faClone} size={size} style={style} />
    </span>
}

export const IconFilterOff: React.FC<IconProps> = ({size = defaultSize, style}) => {
    return <span className="fa-layers fa-fw">
        <FontAwesomeIcon icon={faFilter} size={size} style={style} />
        <FontAwesomeIcon icon={faSlash} size={size} style={style} />
    </span>
}
export const IconFilterOn: React.FC<IconProps> = ({size = defaultSize, style}) => {
    return <span className="fa-layers fa-fw">
        <FontAwesomeIcon icon={faFilter} size={size} style={style} />
        {/*<FontAwesomeIcon icon={faPlus} size={size} style={style} />*/}
    </span>
}

const NavIconColor = "#828ea5"
const NavIconLightColor = "white"
const NavIconSize = "lg"

export const NavIconEyeLight: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faEye} size={size} color={NavIconLightColor}/>
export const NavIconUserGroup: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faUserGroup} size={size} color={NavIconColor}/>
export const NavIconUserGroupLight: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faUserGroup} size={size} color={NavIconLightColor}/>
export const NavIconHash: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faHashtag} size={size} color={NavIconColor}/>
export const NavIconHashLight: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faHashtag} size={size} color={NavIconLightColor}/>
export const NavIconChartSimple: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faChartSimple} size={size} color={NavIconColor}/>
export const NavIconChartSimpleLight: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faChartSimple} size={size} color={NavIconLightColor}/>
export const NavIconTools: React.FC<IconProps> = ({size = NavIconSize}) => <FontAwesomeIcon icon={faToolbox} size={size} color={NavIconLightColor}/>

export const RoutingRatingIcon: React.FC<IconProps> = ({size = NavIconSize}) => {
    return (
        <>
          <span className="fa-stack fa-2x">
            <i className="fa-solid fa-square fa-stack-2x" />
            <i className="fab fa-twitter fa-stack-1x fa-inverse" />
          </span>
        </>
    )
}
