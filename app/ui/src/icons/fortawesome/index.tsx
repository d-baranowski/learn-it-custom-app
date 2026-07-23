import {FontAwesomeIcon} from '@fortawesome/react-fontawesome'
import React from "react";
import {SizeProp} from "@fortawesome/fontawesome-svg-core";
import {faSearch} from '@fortawesome/free-solid-svg-icons/faSearch'
import {
    faArrowRightFromBracket,
    faArrowRightToBracket,
    faEquals,
    faNotEqual,
    faGreaterThan,
    faGreaterThanEqual,
    faLessThan,
    faLessThanEqual,
    faList,
    faArrowsLeftRight,
    faBan,
    faCircleDot,
    faLightbulb
} from '@fortawesome/free-solid-svg-icons'

type IconProps = {
    icon?: any
    size?: SizeProp | undefined
    style?: React.CSSProperties | undefined
    onClick?: any | undefined
}

const defaultSize: SizeProp = "xs"

export const IconComponent: React.FC<IconProps> = ({icon, size = defaultSize, style, onClick}) => <FontAwesomeIcon onClick={onClick} icon={icon} size={size} style={{...{ cursor: onClick ? "pointer" : "" }, ...style}}/>
export const IconSearch: React.FC<IconProps> = (props) => <IconComponent icon={faSearch} {...props}/>
export const IconStartsWith: React.FC<IconProps> = (props) => <IconComponent icon={faArrowRightFromBracket} {...props} />
export const IconEndsWith: React.FC<IconProps> = (props) => <IconComponent icon={faArrowRightToBracket} {...props} />
export const IconEquals: React.FC<IconProps> = (props) => <IconComponent icon={faEquals} {...props} />
export const IconNotEqual: React.FC<IconProps> = (props) => <IconComponent icon={faNotEqual} {...props} />
export const IconGreaterThan: React.FC<IconProps> = (props) => <IconComponent icon={faGreaterThan} {...props} />
export const IconGreaterThanEqual: React.FC<IconProps> = (props) => <IconComponent icon={faGreaterThanEqual} {...props} />
export const IconLessThan: React.FC<IconProps> = (props) => <IconComponent icon={faLessThan} {...props} />
export const IconLessThanEqual: React.FC<IconProps> = (props) => <IconComponent icon={faLessThanEqual} {...props} />
export const IconList: React.FC<IconProps> = (props) => <IconComponent icon={faList} {...props} />
export const IconBetween: React.FC<IconProps> = (props) => <IconComponent icon={faArrowsLeftRight} {...props} />
export const IconBan: React.FC<IconProps> = (props) => <IconComponent icon={faBan} {...props} />
export const IconNull: React.FC<IconProps> = (props) => <IconComponent icon={faCircleDot} {...props} />
export const IconLightbulb: React.FC<IconProps> = (props) => <IconComponent icon={faLightbulb} {...props} />